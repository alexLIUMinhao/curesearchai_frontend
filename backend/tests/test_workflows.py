def test_create_workflow(client):
    response = client.post(
        "/api/workflows",
        json={
            "project_id": "proj-001",
            "name": "Literature Review",
            "description": "Review recent papers on multimodal agents.",
            "stage": "reading",
            "status": "active",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["id"] > 0
    assert data["name"] == "Literature Review"
    assert data["stage"] == "reading"

