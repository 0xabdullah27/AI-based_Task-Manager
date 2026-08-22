"""Integration tests for tasks API subtask functionality (parent/child hierarchy)."""
import pytest


def _create_task(client, auth_headers, **payload):
    response = client.post("/api/todos", json={"title": "Task", **payload}, headers=auth_headers)
    assert response.status_code == 201
    return response.json()


def test_create_subtask_with_parent(client, auth_headers):
    """Subtask creation assigns parent_id and incremental step position."""
    parent = _create_task(client, auth_headers, title="Parent")
    sub1 = _create_task(client, auth_headers, title="Step 1", parent_id=parent["id"])
    sub2 = _create_task(client, auth_headers, title="Step 2", parent_id=parent["id"])

    assert sub1["parent_id"] == parent["id"]
    assert sub2["parent_id"] == parent["id"]
    assert sub1["position"] == 1
    assert sub2["position"] == 2

    detail = client.get(f"/api/todos/{parent['id']}", headers=auth_headers).json()
    assert [s["title"] for s in detail["subtasks"]] == ["Step 1", "Step 2"]


def test_list_returns_root_tasks_only_with_nested_subtasks(client, auth_headers):
    """List endpoint returns only root tasks; subtasks ride along nested in order."""
    parent = _create_task(client, auth_headers, title="Parent")
    _create_task(client, auth_headers, title="Step A", parent_id=parent["id"])
    _create_task(client, auth_headers, title="Step B", parent_id=parent["id"])
    _create_task(client, auth_headers, title="Other root")

    data = client.get("/api/todos", headers=auth_headers).json()
    titles = [t["title"] for t in data["tasks"]]
    assert "Parent" in titles and "Other root" in titles
    assert "Step A" not in titles and "Step B" not in titles

    listed_parent = next(t for t in data["tasks"] if t["id"] == parent["id"])
    assert [s["title"] for s in listed_parent["subtasks"]] == ["Step A", "Step B"]


def test_reject_subtask_under_subtask_one_level_depth(client, auth_headers):
    """A task that is already a subtask cannot become a parent (one level deep)."""
    parent = _create_task(client, auth_headers, title="Parent")
    sub = _create_task(client, auth_headers, title="Step 1", parent_id=parent["id"])

    response = client.post(
        "/api/todos",
        json={"title": "Nested too deep", "parent_id": sub["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_reject_subtask_with_nonexistent_parent(client, auth_headers):
    """Subtask parent must exist."""
    response = client.post(
        "/api/todos",
        json={"title": "Orphan", "parent_id": "nonexistent-id"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_reject_subtask_with_foreign_parent(session, client, auth_headers):
    """Subtask parent must belong to the same user."""
    from src.models.task import Task
    from src.utils.helpers import generate_uuid

    foreign_task = Task(id=generate_uuid(), user_id="other-user-id", title="Foreign task")
    session.add(foreign_task)
    session.commit()

    response = client.post(
        "/api/todos",
        json={"title": "Sneaky subtask", "parent_id": foreign_task.id},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_completion_propagates_up_to_parent(client, auth_headers):
    """Parent auto-completes when all subtasks complete; reopens when one reopens."""
    parent = _create_task(client, auth_headers, title="Parent")
    sub1 = _create_task(client, auth_headers, title="Step 1", parent_id=parent["id"])
    sub2 = _create_task(client, auth_headers, title="Step 2", parent_id=parent["id"])

    client.post(f"/api/todos/{sub1['id']}/toggle", headers=auth_headers)
    detail = client.get(f"/api/todos/{parent['id']}", headers=auth_headers).json()
    assert detail["completed"] is False

    client.post(f"/api/todos/{sub2['id']}/toggle", headers=auth_headers)
    detail = client.get(f"/api/todos/{parent['id']}", headers=auth_headers).json()
    assert detail["completed"] is True

    client.post(f"/api/todos/{sub1['id']}/toggle", headers=auth_headers)
    detail = client.get(f"/api/todos/{parent['id']}", headers=auth_headers).json()
    assert detail["completed"] is False


def test_delete_parent_cascades_to_subtasks(session, client, auth_headers):
    """Deleting a parent removes all of its subtasks."""
    from src.models.task import Task
    from sqlmodel import select

    parent = _create_task(client, auth_headers, title="Parent")
    sub1 = _create_task(client, auth_headers, title="Step 1", parent_id=parent["id"])
    sub2 = _create_task(client, auth_headers, title="Step 2", parent_id=parent["id"])

    response = client.delete(f"/api/todos/{parent['id']}", headers=auth_headers)
    assert response.status_code == 204

    remaining = session.exec(select(Task)).all()
    remaining_ids = {t.id for t in remaining}
    assert parent["id"] not in remaining_ids
    assert sub1["id"] not in remaining_ids
    assert sub2["id"] not in remaining_ids


def test_update_subtask_position(client, auth_headers):
    """PATCH can move a subtask to a new step position."""
    parent = _create_task(client, auth_headers, title="Parent")
    sub1 = _create_task(client, auth_headers, title="Step 1", parent_id=parent["id"])
    sub2 = _create_task(client, auth_headers, title="Step 2", parent_id=parent["id"])

    response = client.patch(
        f"/api/todos/{sub2['id']}",
        json={"position": 1},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["position"] == 1
    assert sub1["id"] != sub2["id"]
