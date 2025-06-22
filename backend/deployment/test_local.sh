#!/bin/bash

# Social Experiment Simulation Platform API - Test Sequence
# Run this script to test all endpoints systematically

BASE_URL="http://localhost:8000"

echo "🚀 Starting API Test Sequence for Social Experiment Platform"
echo "============================================================"

# 1. Test API Root and Health
echo "📍 1. Testing Root Endpoint"
curl -s "$BASE_URL/" | jq '.'
echo -e "\n"

echo "📍 2. Testing Health Check"
curl -s "$BASE_URL/health" | jq '.'
echo -e "\n"

# 2. Template Management Tests
echo "📍 3. Listing All Templates (should be empty initially)"
curl -s "$BASE_URL/templates" | jq '.'
echo -e "\n"

echo "📍 4. Creating First Template - Political Debate"
curl -s -X POST "$BASE_URL/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "political_debate_v1",
    "description": "A simulation of political debate between different ideological factions",
    "template_data": {
      "template_name": "Political Debate Simulation",
      "rounds": 3,
      "conversations_per_round": 4,
      "factions": {
        "conservatives": {
          "faction_prompt": "Conservative political faction focusing on traditional values",
          "agent_count": 2,
          "person_prompts": ["traditional", "cautious", "skeptical"]
        },
        "liberals": {
          "faction_prompt": "Liberal political faction advocating for progressive change",
          "agent_count": 2,
          "person_prompts": ["progressive", "open-minded", "idealistic"]
        },
        "moderates": {
          "faction_prompt": "Moderate faction seeking balanced compromise solutions",
          "agent_count": 1,
          "person_prompts": ["balanced", "pragmatic", "diplomatic"]
        }
      }
    }
  }' | jq '.'
echo -e "\n"

echo "📍 5. Creating Second Template - Business Negotiation"
curl -s -X POST "$BASE_URL/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "business_negotiation_v1",
    "description": "Corporate merger negotiation simulation",
    "template_data": {
      "template_name": "Corporate Merger Negotiation",
      "rounds": 5,
      "conversations_per_round": 6,
      "factions": {
        "buyers": {
          "description": "Acquiring company representatives",
          "agent_count": 3,
          "goals": ["minimize_cost", "maximize_value"]
        },
        "sellers": {
          "description": "Target company representatives", 
          "agent_count": 3,
          "goals": ["maximize_price", "protect_employees"]
        }
      }
    }
  }' | jq '.'
echo -e "\n"

echo "📍 6. Testing Duplicate Template Creation (should fail)"
curl -s -X POST "$BASE_URL/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "political_debate_v1",
    "description": "Duplicate template",
    "template_data": {
      "template_name": "Duplicate",
      "rounds": 2,
      "conversations_per_round": 2,
      "factions": {
        "test": {"description": "test", "agent_count": 1}
      }
    }
  }' | jq '.'
echo -e "\n"

echo "📍 7. Testing Invalid Template (missing required fields)"
curl -s -X POST "$BASE_URL/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "invalid_template",
    "description": "Missing required fields",
    "template_data": {
      "template_name": "Invalid Template"
    }
  }' | jq '.'
echo -e "\n"

echo "📍 8. Listing All Templates (should show 2 templates)"
curl -s "$BASE_URL/templates" | jq '.'
echo -e "\n"

echo "📍 9. Getting Specific Template Details"
curl -s "$BASE_URL/templates/political_debate_v1" | jq '.'
echo -e "\n"

echo "📍 10. Getting Non-existent Template (should fail)"
curl -s "$BASE_URL/templates/non_existent_template" | jq '.'
echo -e "\n"

# 3. Experiment Management Tests
echo "📍 11. Listing All Experiments (should be empty initially)"
curl -s "$BASE_URL/experiments" | jq '.'
echo -e "\n"

echo "📍 12. Starting First Experiment - coffee_misinformation"
EXPERIMENT_1=$(curl -s -X POST "$BASE_URL/run_experiment" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "coffee_misinformation",
    "rounds": 3,
    "conversations_per_round": 3
  }' | jq -r '.experiment_id')

echo "Started experiment: $EXPERIMENT_1"
# curl -s -X POST "$BASE_URL/run_experiment" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "template_id": "political_debate_v1",
#     "rounds": 2,
#     "conversations_per_round": 3
#   }' | jq '.'
# echo -e "\n"

# echo "📍 13. Starting Second Experiment - Business Negotiation"
# EXPERIMENT_2=$(curl -s -X POST "$BASE_URL/run_experiment" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "template_id": "business_negotiation_v1"
#   }' | jq -r '.experiment_id')

# echo "Started experiment: $EXPERIMENT_2"
# curl -s -X POST "$BASE_URL/run_experiment" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "template_id": "business_negotiation_v1"
#   }' | jq '.'
# echo -e "\n"

# echo "📍 14. Trying to Start Experiment with Non-existent Template (should fail)"
# curl -s -X POST "$BASE_URL/run_experiment" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "template_id": "non_existent_template"
#   }' | jq '.'
# echo -e "\n"

echo "📍 15. Listing All Experiments (should show 2 experiments)"
curl -s "$BASE_URL/experiments" | jq '.'
echo -e "\n"

# Wait a moment for experiments to potentially start/complete
echo "⏳ Waiting 3 seconds for experiments to process..."
sleep 3

echo "📍 16. Checking Status of First Experiment"
if [ "$EXPERIMENT_1" != "null" ] && [ -n "$EXPERIMENT_1" ]; then
    curl -s "$BASE_URL/experiments/$EXPERIMENT_1/status" | jq '.'
else
    echo "Experiment ID not available, using placeholder"
    curl -s "$BASE_URL/experiments/test_experiment_id/status" | jq '.'
fi
echo -e "\n"

echo "📍 17. Getting Details of First Experiment"
if [ "$EXPERIMENT_1" != "null" ] && [ -n "$EXPERIMENT_1" ]; then
    curl -s "$BASE_URL/experiments/$EXPERIMENT_1" | jq '.'
else
    echo "Experiment ID not available, using placeholder"
    curl -s "$BASE_URL/experiments/test_experiment_id" | jq '.'
fi
echo -e "\n"

echo "📍 18. Getting Conversations from First Experiment"
if [ "$EXPERIMENT_1" != "null" ] && [ -n "$EXPERIMENT_1" ]; then
    curl -s "$BASE_URL/experiments/$EXPERIMENT_1/conversations" | jq '.'
else
    echo "Experiment ID not available, using placeholder"
    curl -s "$BASE_URL/experiments/test_experiment_id/conversations" | jq '.'
fi
echo -e "\n"

echo "📍 19. Getting Results from First Experiment"
if [ "$EXPERIMENT_1" != "null" ] && [ -n "$EXPERIMENT_1" ]; then
    curl -s "$BASE_URL/experiments/$EXPERIMENT_1/result" | jq '.'
else
    echo "Experiment ID not available, using placeholder"
    curl -s "$BASE_URL/experiments/test_experiment_id/result" | jq '.'
fi
echo -e "\n"

# echo "📍 20. Testing Non-existent Experiment Status"
# curl -s "$BASE_URL/experiments/non_existent_experiment/status" | jq '.'
# echo -e "\n"

# echo "📍 21. Testing Non-existent Experiment Conversations"
# curl -s "$BASE_URL/experiments/non_existent_experiment/conversations" | jq '.'
# echo -e "\n"

# # Wait longer for experiments to potentially complete
# echo "⏳ Waiting additional 5 seconds for experiments to complete..."
# sleep 5

# echo "📍 22. Final Status Check of Both Experiments"
# if [ "$EXPERIMENT_1" != "null" ] && [ -n "$EXPERIMENT_1" ]; then
#     echo "Experiment 1 Status:"
#     curl -s "$BASE_URL/experiments/$EXPERIMENT_1/status" | jq '.'
# fi

# if [ "$EXPERIMENT_2" != "null" ] && [ -n "$EXPERIMENT_2" ]; then
#     echo "Experiment 2 Status:"
#     curl -s "$BASE_URL/experiments/$EXPERIMENT_2/status" | jq '.'
# fi
# echo -e "\n"

# echo "📍 23. Final Health Check"
# curl -s "$BASE_URL/health" | jq '.'
# echo -e "\n"

# echo "📍 24. Testing Delete Experiment (if completed)"
# if [ "$EXPERIMENT_1" != "null" ] && [ -n "$EXPERIMENT_1" ]; then
#     echo "Attempting to delete experiment: $EXPERIMENT_1"
#     curl -s -X DELETE "$BASE_URL/experiments/$EXPERIMENT_1" | jq '.'
# else
#     echo "Testing delete with placeholder ID"
#     curl -s -X DELETE "$BASE_URL/experiments/test_experiment_id" | jq '.'
# fi
# echo -e "\n"

# echo "🎉 API Test Sequence Completed!"
# echo "================================"
# echo "Summary of tests performed:"
# echo "✅ Root endpoint (/)"
# echo "✅ Health check (/health)"
# echo "✅ Template creation (POST /templates)"
# echo "✅ Template listing (GET /templates)"
# echo "✅ Template details (GET /templates/{id})"
# echo "✅ Experiment creation (POST /run_experiment)"
# echo "✅ Experiment listing (GET /experiments)"
# echo "✅ Experiment status (GET /experiments/{id}/status)"
# echo "✅ Experiment details (GET /experiments/{id})"
# echo "✅ Experiment conversations (GET /experiments/{id}/conversations)"
# echo "✅ Experiment results (GET /experiments/{id}/result)"
# echo "✅ Experiment deletion (DELETE /experiments/{id})"
# echo "✅ Error handling for non-existent resources"
# echo "✅ Validation testing for invalid requests"
# echo ""
# echo "🔍 Check the responses above for any errors or unexpected behavior"