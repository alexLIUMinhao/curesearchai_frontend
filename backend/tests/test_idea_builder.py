from io import BytesIO


def _create_structured_source(client):
    workflow_response = client.post(
        "/api/workflows",
        json={
            "project_id": "proj-ib",
            "name": "Idea Builder Workflow",
            "description": "Drive a structured idea flow from sources.",
            "stage": "reading",
            "status": "active",
        },
    )
    workflow_id = workflow_response.json()["data"]["id"]
    upload_response = client.post(
        "/api/assets/upload",
        data={
            "workflow_id": str(workflow_id),
            "type": "txt",
            "name": "source.txt",
        },
        files={"file": ("source.txt", BytesIO(b"A baseline for multimodal forecasting with failure-case discussion."), "text/plain")},
    )
    asset_id = upload_response.json()["data"]["id"]
    run_response = client.post("/api/skills/run-asset", json={"asset_id": asset_id, "skill_name": "asset_structurer"})
    assert run_response.status_code == 201
    return workflow_id


def test_idea_builder_start_and_progress_to_direction_choice(client):
    workflow_id = _create_structured_source(client)

    start_response = client.post("/api/idea-builder/start", json={"workflow_id": workflow_id})
    assert start_response.status_code == 200
    assert start_response.json()["data"]["phase"] == "background"

    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "user_message": "I work on multimodal learning and mainly run experiments."})
    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "user_message": "I have one baseline repo, a small dataset, and limited GPU budget."})
    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "user_message": "I know the basics and have done one reproduction."})
    final_response = client.post(
        "/api/idea-builder/respond",
        json={"workflow_id": workflow_id, "user_message": "I suspect the current evaluation misses some failure modes."},
    )

    assert final_response.status_code == 200
    data = final_response.json()["data"]
    assert data["phase"] == "direction_choice"
    assert any(message["content"].startswith("[Deep Research Snapshot]") for message in data["assistant_messages"])
    assert any(message["content"].startswith("[Idea Direction Options]") for message in data["assistant_messages"])


def test_idea_builder_generates_task_drafts_after_confirmation(client):
    workflow_id = _create_structured_source(client)
    client.post("/api/idea-builder/start", json={"workflow_id": workflow_id})
    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "user_message": "I study multimodal research and want an execution-focused idea."})
    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "user_message": "I have code, data, and enough compute for one focused experiment."})
    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "user_message": "I understand the baseline but not the biggest weakness."})
    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "user_message": "I think an improvement-style direction is the most realistic."})
    client.post("/api/idea-builder/respond", json={"workflow_id": workflow_id, "direction_choice": "improvement"})
    refinement_response = client.post(
        "/api/idea-builder/respond",
        json={"workflow_id": workflow_id, "user_message": "The target problem is improving robustness, the angle is a targeted module change, and the next step is one ablation."},
    )
    assert refinement_response.status_code == 200
    assert refinement_response.json()["data"]["phase"] == "task_check"

    generate_response = client.post(
        "/api/idea-builder/respond",
        json={"workflow_id": workflow_id, "action": "generate_tasks"},
    )
    assert generate_response.status_code == 200
    data = generate_response.json()["data"]
    assert data["phase"] == "completed"
    assert len(data["task_drafts"]) >= 2
    assert data["memory_note"]["title"] == "Idea Builder: Idea Builder Workflow"
