from io import BytesIO


def test_run_asset_structurer_creates_chat_note_and_metadata(client):
    workflow_response = client.post(
        "/api/workflows",
        json={
            "project_id": "proj-003",
            "name": "Source Structuring",
            "description": "Structure a single uploaded source.",
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
            "name": "paper-notes.txt",
        },
        files={
            "file": ("paper-notes.txt", BytesIO(b"This paper studies multimodal emotion recognition with a contrastive baseline."), "text/plain")
        },
    )
    assert upload_response.status_code == 201
    asset = upload_response.json()["data"]

    run_response = client.post(
        "/api/skills/run-asset",
        json={
            "asset_id": asset["id"],
            "skill_name": "asset_structurer",
        },
    )

    assert run_response.status_code == 201
    data = run_response.json()["data"]
    assert data["status"] == "completed"
    assert data["assistant_message"]["role"] == "assistant"
    assert data["memory_note"]["note_type"] == "summary"
    assert data["result"]["skill_name"] == "asset_structurer"

    asset_detail = client.get(f"/api/assets/{asset['id']}")
    assert asset_detail.status_code == 200
    metadata = asset_detail.json()["data"]["metadata_json"]
    assert metadata["skills"]["asset_structurer"]["status"] == "completed"

    history = client.get(f"/api/chat/history/{workflow_id}")
    assert history.status_code == 200
    assert any(item["content"].startswith("[Structured Source Summary]") for item in history.json()["data"])

    notes = client.get(f"/api/notes?workflow_id={workflow_id}")
    assert notes.status_code == 200
    assert any(note["title"] == "Structured Source: paper-notes.txt" for note in notes.json()["data"])


def test_run_asset_structurer_unsupported_file_marks_metadata(client):
    workflow_response = client.post(
        "/api/workflows",
        json={
            "project_id": "proj-004",
            "name": "Unsupported Source",
            "description": "Reject unsupported sources cleanly.",
            "stage": "reading",
            "status": "active",
        },
    )
    workflow_id = workflow_response.json()["data"]["id"]

    upload_response = client.post(
        "/api/assets/upload",
        data={
            "workflow_id": str(workflow_id),
            "type": "doc",
            "name": "legacy.doc",
        },
        files={
            "file": ("legacy.doc", BytesIO(b"binary-placeholder"), "application/msword")
        },
    )
    asset_id = upload_response.json()["data"]["id"]

    run_response = client.post(
        "/api/skills/run-asset",
        json={
            "asset_id": asset_id,
            "skill_name": "asset_structurer",
        },
    )

    assert run_response.status_code == 201
    data = run_response.json()["data"]
    assert data["status"] == "unsupported"
    assert data["assistant_message"] is None
    assert data["memory_note"] is None
    assert "not supported" in data["result"]["error"].lower()
