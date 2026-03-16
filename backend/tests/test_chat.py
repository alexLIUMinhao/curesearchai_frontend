def test_send_chat_message(client):
    workflow_response = client.post(
        "/api/workflows",
        json={
            "project_id": "proj-002",
            "name": "Experiment Planning",
            "description": "Plan the next ablation round.",
            "stage": "experiment",
            "status": "active",
        },
    )
    workflow_id = workflow_response.json()["data"]["id"]

    response = client.post(
        "/api/chat/send",
        json={
            "workflow_id": workflow_id,
            "message": "帮我梳理一下下一步实验怎么做。",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["user_message"]["role"] == "user"
    assert data["assistant_message"]["role"] == "assistant"
    assert "下一步建议" in data["assistant_message"]["content"]
    assert len(data["optional_tasks"]) == 1

