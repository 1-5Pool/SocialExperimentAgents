import random
import json
from typing import List, Dict, Any
from math import ceil
from domain.entities import AgentCount, Conversation, ExperimentResult, Experiment
from infrastructure.db import DBRepository
from services.agent.dummy import DummyAgent, DummyModerator
from services.agent.interface import AgentInterface, ModeratorInterface


class SimulationService:
    def __init__(
        self,
        repo: DBRepository,
        template_id: str,
        moderator: ModeratorInterface = None,
        rounds: int = None,
        conversations_per_round: int = None,
        max_conversations_per_agent: int = None,
        max_message_length: int = None,
    ):

        self.repo = repo
        self.template_id = template_id
        self.moderator = moderator or DummyModerator("mod-001")

        # Load template
        template = repo.get_template_by_id(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")

        self.template_data = json.loads(template.template_data)

        # Use provided parameters or template defaults
        self.rounds = rounds or self.template_data.get("rounds", 5)
        self.conversations_per_round = (
            conversations_per_round
            or self.template_data.get("conversations_per_round", 6)
        )
        self.max_conversations_per_agent = max_conversations_per_agent or 3
        self.max_message_length = max_message_length or 500

        # Generate agents with name mapping and distributed personal prompts
        self.agents: List[AgentInterface] = []
        self.agent_name_map: Dict[str, AgentInterface] = {}
        self._generate_agents()

        # Create experiment
        self.experiment_id = self.repo.insert_experiment(template_id, len(self.agents))
        self.experiment = Experiment(
            experiment_id=self.experiment_id,
            template_id=template_id,
            num_agents=len(self.agents),
        )
        self.sequence_no = 0

        # Insert agent counts
        self._insert_agent_counts()

    def _generate_agents(self):
        """Generate agents with distributed personal prompts and name injection"""
        agent_counter = 1

        for faction_name, faction_data in self.template_data["factions"].items():
            agent_count = faction_data.get("agent_count", 1)
            faction_prompt = faction_data.get("faction_prompt", "")
            person_prompts = faction_data.get("person_prompt", [])
            powers = faction_data.get("powers", [])

            # Distribute personal prompts equally
            distributed_prompts = self._distribute_personal_prompts(
                person_prompts, agent_count
            )

            for i in range(agent_count):
                agent_name = f"Agent_{agent_counter}"
                agent_id = f"agent_{agent_counter}"

                # Get the personal prompt for this agent and inject name
                personal_prompt = distributed_prompts[i]
                if personal_prompt:
                    personal_prompt = personal_prompt.format(name=agent_name)

                agent = DummyAgent(
                    agent_id=agent_id,
                    name=agent_name,
                    role=faction_name,
                    faction_prompt=faction_prompt,
                    personal_prompt=personal_prompt,
                    powers=powers,
                )

                agent.max_conversations_per_day = self.max_conversations_per_agent

                self.agents.append(agent)
                self.agent_name_map[agent_name] = agent
                self.agent_name_map[agent_id] = agent  # Also map by ID

                agent_counter += 1

    def _distribute_personal_prompts(
        self, prompts: List[str], agent_count: int
    ) -> List[str]:
        """Distribute personal prompts equally among agents"""
        if not prompts:
            return [""] * agent_count

        if len(prompts) >= agent_count:
            # More prompts than agents, just take the first agent_count prompts
            return prompts[:agent_count]

        # Fewer prompts than agents, distribute equally
        distributed = []
        prompts_per_group = agent_count // len(prompts)
        remainder = agent_count % len(prompts)

        for i, prompt in enumerate(prompts):
            # Add base amount for each prompt
            count = prompts_per_group
            # Add one extra for the first 'remainder' prompts
            if i < remainder:
                count += 1

            distributed.extend([prompt] * count)

        return distributed

    def _insert_agent_counts(self):
        """Insert agent count data into database"""
        counts = {}
        for agent in self.agents:
            counts[agent.role] = counts.get(agent.role, 0) + 1

        agent_counts = [
            AgentCount(self.experiment, role, count) for role, count in counts.items()
        ]
        self.repo.insert_agent_counts(self.experiment_id, agent_counts)

    def run(self) -> str:
        """Run the complete simulation"""
        print(
            f"Starting simulation with {len(self.agents)} agents for {self.rounds} rounds"
        )
        print(
            f"Agent distribution: {', '.join([f'{agent.role}:{agent.name}' for agent in self.agents])}"
        )

        for day in range(1, self.rounds + 1):
            print(f"Running day {day}")
            self._run_day(day)

        # End phase for all agents
        all_conversations = self.repo.get_all_conversations(self.experiment_id)
        for agent in self.agents:
            agent.end(all_conversations)

        # Generate final report
        print("Generating final report...")
        raw_report = self.moderator.review_conversations(
            self.experiment_id, all_conversations
        )
        self.repo.insert_experiment_result(
            ExperimentResult(self.experiment_id, raw_report)
        )

        print(f"Simulation completed. Experiment ID: {self.experiment_id}")
        return self.experiment_id

    def _run_day(self, day: int):
        """Run a single day of the simulation"""
        # Reset daily conversation counts
        for agent in self.agents:
            agent.reset_daily_count()

        # Generate conversation pairs
        pairs = self._generate_conversation_pairs()

        context = f"Day {day} of {self.template_data.get('template_name', 'experiment')}. {self.template_data.get('content_prompt', '')}"

        conversations_today = []

        for agent_a, agent_b in pairs:
            if agent_a.can_participate() and agent_b.can_participate():
                # Agent A sends message to Agent B
                msg_a = agent_a.send_message_to(agent_b, context)
                if len(msg_a) > self.max_message_length:
                    msg_a = msg_a[: self.max_message_length]

                conv_a = Conversation(
                    self.experiment_id,
                    day,
                    self.sequence_no,
                    agent_a.name,
                    agent_b.name,
                    msg_a,
                )
                self.repo.insert_conversation(conv_a)
                conversations_today.append(conv_a)
                agent_b.receive_message(msg_a, agent_a)
                self.sequence_no += 1

                # Agent B responds to Agent A
                msg_b = agent_b.send_message_to(
                    agent_a, f"Responding to: {msg_a[:50]}..."
                )
                if len(msg_b) > self.max_message_length:
                    msg_b = msg_b[: self.max_message_length]

                conv_b = Conversation(
                    self.experiment_id,
                    day,
                    self.sequence_no,
                    agent_b.name,
                    agent_a.name,
                    msg_b,
                )
                self.repo.insert_conversation(conv_b)
                conversations_today.append(conv_b)
                agent_a.receive_message(msg_b, agent_b)
                self.sequence_no += 1

        # Rest phase for all agents
        for agent in self.agents:
            agent_conversations = [
                c
                for c in conversations_today
                if c.agent_1 == agent.name or c.agent_2 == agent.name
            ]
            agent.rest(agent_conversations)

    def _generate_conversation_pairs(self) -> List[tuple]:
        """Generate conversation pairs respecting agent limits and max conversations per round"""
        available_agents = [agent for agent in self.agents if agent.can_participate()]
        pairs = []

        # Limit by conversations per round
        max_pairs = min(self.conversations_per_round, len(available_agents) // 2)

        attempts = 0
        max_attempts = max_pairs * 10  # Prevent infinite loops

        while (
            len(pairs) < max_pairs
            and len(available_agents) >= 2
            and attempts < max_attempts
        ):
            # Randomly select two different agents
            agent_a = random.choice(available_agents)
            potential_partners = [
                a
                for a in available_agents
                if a.id != agent_a.id and a.can_participate()
            ]

            if not potential_partners:
                break

            agent_b = random.choice(potential_partners)
            pairs.append((agent_a, agent_b))

            # Update available agents (they might not be able to participate anymore)
            available_agents = [
                agent for agent in self.agents if agent.can_participate()
            ]
            attempts += 1

        print(f"Generated {len(pairs)} conversation pairs")
        return pairs

    def get_agent_by_name(self, name: str) -> AgentInterface:
        """Get agent by name from internal mapping"""
        return self.agent_name_map.get(name)

    def get_all_agent_names(self) -> List[str]:
        """Get all agent names"""
        return [agent.name for agent in self.agents]

    def get_agents_by_faction(self, faction: str) -> List[AgentInterface]:
        """Get all agents of a specific faction"""
        return [agent for agent in self.agents if agent.role == faction]
