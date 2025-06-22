from agent import MultiAgentConversation
import random
from pydantic import BaseModel, Field
from typing import List, Optional
#from python_dotenv import load_dotenv

#load_dotenv()

def main():
    """Main function to run the multi-agent conversation"""
    conversation = MultiAgentConversation()
    
    
    # Create agents
    if not conversation.create_agents():
        print("Failed to create agents. Exiting.")
        return
    
        
    #     # List of interesting topics for conversation
    topics = [
        "Coffee causes cancer"
        "the future of human consciousness"
    ]
     
    topics = "Coffee causes cancer"
    conversation.moderate_conversation(topics, rounds=2)


    #     # Let user choose topic or pick randomly
    #     print("\n🎯 Available conversation topics:")
    #     for i, topic in enumerate(topics, 1):
    #         print(f"{i}. {topic}")
        
    #     choice = input(f"\nEnter topic number (1-{len(topics)}) or press Enter for random: ").strip()
        
    #     if choice.isdigit() and 1 <= int(choice) <= len(topics):
    #         selected_topic = topics[int(choice) - 1]
    #     else:
    #         selected_topic = random.choice(topics)
        
    #     # Start the conversation
    #     conversation.moderate_conversation(selected_topic, rounds=2)
        
    #     # Ask if user wants another conversation
    #     another = input("\n🔄 Would you like to start another conversation? (y/n): ").lower()
    #     if another == 'y':
    #         new_topic = input("Enter a custom topic or press Enter for random: ").strip()
    #         if not new_topic:
    #             new_topic = random.choice(topics)
    #         conversation.moderate_conversation(new_topic, rounds=2)
            
    # except KeyboardInterrupt:
    #     print("\n⏹️  Conversation interrupted by user")
    # except Exception as e:
    #     print(f"💥 Unexpected error: {e}")
    # finally:
    #     # Clean up
    #     print("\n🧹 Cleaning up agents...")
    #     conversation.cleanup()
    #     print("👋 Goodbye!")

if __name__ == "__main__":
    main()