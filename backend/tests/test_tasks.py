def test_update_task_status(client):
    workflow_response = client.post(
        "/api/workflows",
        json={
            "project_id": "proj-003",
            "name": "Draft Writing",
            "description": "Prepare paper draft sections.",
            "stage": "writing",
            "status": "active",
        },
    )
    workflow_id = workflow_response.json()["data"]["id"]

    task_response = client.post(
        "/api/tasks",
        json={
            "workflow_id": workflow_id,
            "title": "Write related work",
            "description": "Summarize baseline methods.",
            "priority": "high",
            "status": "todo",
        },
    )
    task_id = task_response.json()["data"]["id"]

    update_response = client.put(
        f"/api/tasks/{task_id}",
        json={
            "status": "doing",
            "owner": "alice",
        },
    )

    assert update_response.status_code == 200
    data = update_response.json()["data"]
    assert data["status"] == "doing"
    assert data["owner"] == "alice"

