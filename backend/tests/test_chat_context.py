from io import BytesIO


def _create_structured_workflow(client):
    workflow_response = client.post(
        "/api/workflows",
        json={
            "project_id": "proj-chat-context",
            "name": "Chat Context Workflow",
            "description": "Validate context-aware QA routing.",
            "stage": "reading",
            "status": "active",
        },
    )
    workflow = workflow_response.json()["data"]
    upload_response = client.post(
        "/api/assets/upload",
        data={
            "workflow_id": str(workflow["id"]),
            "type": "txt",
            "name": "paper-a.txt",
        },
        files={"file": ("paper-a.txt", BytesIO(b"This paper proposes a robust multimodal baseline and reports failure cases."), "text/plain")},
    )
    asset_id = upload_response.json()["data"]["id"]
    run_response = client.post("/api/skills/run-asset", json={"asset_id": asset_id, "skill_name": "asset_structurer"})
    assert run_response.status_code == 201
    return workflow


def test_chat_send_uses_structured_context_and_updates_memory(client):
    workflow = _create_structured_workflow(client)

    response = client.post(
        "/api/chat/send",
        json={
            "workflow_id": workflow["id"],
            "message": "这篇论文讲了什么？",
            "mode_hint": "auto",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["route"] == "qa"
    assert data["intent"] == "qa_source_summary"
    assert len(data["context_sources"]) >= 1
    assert data["context_sources"][0]["name"] == "paper-a.txt"

    notes = client.get(f"/api/notes?workflow_id={workflow['id']}")
    assert notes.status_code == 200
    assert any(note["title"] == "Conversation Memory: Chat Context Workflow" for note in notes.json()["data"])


def test_chat_send_qa_does_not_advance_idea_builder_phase(client):
    workflow = _create_structured_workflow(client)
    start_response = client.post("/api/idea-builder/start", json={"workflow_id": workflow["id"]})
    assert start_response.status_code == 200

    before_state = client.get(f"/api/idea-builder/state/{workflow['id']}").json()["data"]
    assert before_state["phase"] == "background"

    response = client.post(
        "/api/chat/send",
        json={
            "workflow_id": workflow["id"],
            "message": "这篇论文讲了什么？",
            "mode_hint": "auto",
        },
    )
    assert response.status_code == 201
    assert response.json()["data"]["route"] == "qa"

    after_state = client.get(f"/api/idea-builder/state/{workflow['id']}").json()["data"]
    assert after_state["phase"] == "background"


def test_chat_send_general_question_prefers_free_chat_when_idea_builder_active(client):
    workflow = _create_structured_workflow(client)
    start_response = client.post("/api/idea-builder/start", json={"workflow_id": workflow["id"]})
    assert start_response.status_code == 200

    response = client.post(
        "/api/chat/send",
        json={
            "workflow_id": workflow["id"],
            "message": "How does this baseline compare to the source claims?",
            "mode_hint": "auto",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["route"] == "qa"
    assert data["intent"] == "general_chat"
