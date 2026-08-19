"""
Test: [Resource] CRUD Operations

Spec: [spec-id]
Task: [task-id]

Tests CRUD operations for [Resource] following TDD principles.
Coverage target: 70%+
"""

import pytest
from sqlmodel import Session, select
from app.models.[model_module] import [ModelName]
from app.crud.[crud_module] import (
    create_[resource],
    get_[resource],
    get_[resources],
    update_[resource],
    delete_[resource],
)


class Test[Resource]CRUD:
    """Test suite for [Resource] CRUD operations"""

    def test_create_[resource]_success(self, session: Session, user):
        """Test creating a [resource] successfully"""
        # Arrange
        [resource]_data = {
            "field1": "value1",
            "field2": "value2",
            "user_id": user.id,
        }

        # Act
        [resource] = create_[resource](session, [resource]_data)

        # Assert
        assert [resource].id is not None
        assert [resource].field1 == [resource]_data["field1"]
        assert [resource].field2 == [resource]_data["field2"]
        assert [resource].user_id == user.id

    def test_create_[resource]_with_optional_fields(self, session: Session, user):
        """Test creating [resource] with optional fields"""
        # Arrange
        [resource]_data = {
            "field1": "value1",
            "field2": "value2",
            "optional_field": "optional_value",
            "user_id": user.id,
        }

        # Act
        [resource] = create_[resource](session, [resource]_data)

        # Assert
        assert [resource].optional_field == "optional_value"

    def test_create_[resource]_missing_required_field_raises_error(self, session: Session):
        """Test creating [resource] without required field raises error"""
        # Arrange
        invalid_data = {
            "field2": "value2",
            # Missing required field1
        }

        # Act & Assert
        with pytest.raises(ValueError, match="field1 is required"):
            create_[resource](session, invalid_data)

    def test_create_[resource]_commits_to_database(self, session: Session, user):
        """Test created [resource] is persisted to database"""
        # Arrange
        [resource]_data = {
            "field1": "value1",
            "field2": "value2",
            "user_id": user.id,
        }

        # Act
        [resource] = create_[resource](session, [resource]_data)
        [resource]_id = [resource].id

        # Assert - Query database directly
        result = session.get([ModelName], [resource]_id)
        assert result is not None
        assert result.field1 == "value1"

    def test_get_[resource]_by_id_success(self, session: Session, user):
        """Test getting a [resource] by ID"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()
        session.refresh([resource])

        # Act
        result = get_[resource](session, [resource].id)

        # Assert
        assert result is not None
        assert result.id == [resource].id
        assert result.field1 == [resource].field1

    def test_get_[resource]_not_found_returns_none(self, session: Session):
        """Test getting non-existent [resource] returns None"""
        # Arrange
        non_existent_id = "non-existent-id"

        # Act
        result = get_[resource](session, non_existent_id)

        # Assert
        assert result is None

    def test_get_[resource]_by_user_id(self, session: Session, user):
        """Test getting [resource] filtered by user_id"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()

        # Act
        result = get_[resource](session, [resource].id, user_id=user.id)

        # Assert
        assert result is not None
        assert result.user_id == user.id

    def test_get_[resource]_wrong_user_returns_none(self, session: Session, user):
        """Test getting [resource] with wrong user_id returns None"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()

        # Act
        result = get_[resource](session, [resource].id, user_id="other-user-id")

        # Assert
        assert result is None

    def test_get_[resources]_returns_all(self, session: Session, user):
        """Test getting all [resources] for a user"""
        # Arrange
        [resource]1 = [ModelName](field1="value1", field2="test", user_id=user.id)
        [resource]2 = [ModelName](field1="value2", field2="test", user_id=user.id)
        [resource]3 = [ModelName](field1="value3", field2="test", user_id=user.id)
        session.add_all([[resource]1, [resource]2, [resource]3])
        session.commit()

        # Act
        results = get_[resources](session, user_id=user.id)

        # Assert
        assert len(results) == 3
        assert all(r.user_id == user.id for r in results)

    def test_get_[resources]_filters_by_user(self, session: Session, user):
        """Test get_[resources] only returns user's [resources]"""
        # Arrange
        user_[resource] = [ModelName](field1="user", field2="test", user_id=user.id)
        other_[resource] = [ModelName](field1="other", field2="test", user_id="other-user")
        session.add_all([user_[resource], other_[resource]])
        session.commit()

        # Act
        results = get_[resources](session, user_id=user.id)

        # Assert
        assert len(results) == 1
        assert results[0].field1 == "user"

    def test_get_[resources]_with_pagination(self, session: Session, user):
        """Test getting [resources] with pagination"""
        # Arrange
        for i in range(10):
            [resource] = [ModelName](field1=f"value{i}", field2="test", user_id=user.id)
            session.add([resource])
        session.commit()

        # Act
        results = get_[resources](session, user_id=user.id, skip=5, limit=3)

        # Assert
        assert len(results) == 3

    def test_get_[resources]_with_filter(self, session: Session, user):
        """Test getting [resources] with filter"""
        # Arrange
        [resource]1 = [ModelName](field1="value1", field2="active", user_id=user.id)
        [resource]2 = [ModelName](field1="value2", field2="active", user_id=user.id)
        [resource]3 = [ModelName](field1="value3", field2="inactive", user_id=user.id)
        session.add_all([[resource]1, [resource]2, [resource]3])
        session.commit()

        # Act
        results = get_[resources](session, user_id=user.id, field2="active")

        # Assert
        assert len(results) == 2
        assert all(r.field2 == "active" for r in results)

    def test_get_[resources]_empty_list(self, session: Session, user):
        """Test getting [resources] returns empty list when none exist"""
        # Arrange - No [resources] created

        # Act
        results = get_[resources](session, user_id=user.id)

        # Assert
        assert results == []

    def test_update_[resource]_success(self, session: Session, user):
        """Test updating a [resource] successfully"""
        # Arrange
        [resource] = [ModelName](field1="original", field2="value", user_id=user.id)
        session.add([resource])
        session.commit()
        session.refresh([resource])

        update_data = {"field1": "updated"}

        # Act
        updated_[resource] = update_[resource](session, [resource].id, update_data)

        # Assert
        assert updated_[resource].field1 == "updated"
        assert updated_[resource].field2 == "value"  # Unchanged

    def test_update_[resource]_partial_update(self, session: Session, user):
        """Test partial update of [resource]"""
        # Arrange
        [resource] = [ModelName](
            field1="value1",
            field2="value2",
            optional_field="original",
            user_id=user.id
        )
        session.add([resource])
        session.commit()

        update_data = {"field1": "updated"}

        # Act
        updated_[resource] = update_[resource](session, [resource].id, update_data)

        # Assert
        assert updated_[resource].field1 == "updated"
        assert updated_[resource].field2 == "value2"
        assert updated_[resource].optional_field == "original"

    def test_update_[resource]_not_found_raises_error(self, session: Session):
        """Test updating non-existent [resource] raises error"""
        # Arrange
        update_data = {"field1": "updated"}

        # Act & Assert
        with pytest.raises(ValueError, match="[Resource] not found"):
            update_[resource](session, "non-existent-id", update_data)

    def test_update_[resource]_validates_user_id(self, session: Session, user):
        """Test updating [resource] validates user ownership"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()

        update_data = {"field1": "updated"}

        # Act & Assert
        with pytest.raises(ValueError, match="Not authorized"):
            update_[resource](session, [resource].id, update_data, user_id="other-user")

    def test_update_[resource]_persists_to_database(self, session: Session, user):
        """Test update is persisted to database"""
        # Arrange
        [resource] = [ModelName](field1="original", field2="value", user_id=user.id)
        session.add([resource])
        session.commit()
        [resource]_id = [resource].id

        # Act
        update_[resource](session, [resource]_id, {"field1": "updated"})

        # Assert - Query database directly
        result = session.get([ModelName], [resource]_id)
        assert result.field1 == "updated"

    def test_update_[resource]_updates_timestamp(self, session: Session, user):
        """Test updating [resource] updates updated_at timestamp"""
        # Arrange
        [resource] = [ModelName](field1="original", field2="value", user_id=user.id)
        session.add([resource])
        session.commit()
        session.refresh([resource])
        original_updated_at = [resource].updated_at

        # Act
        import time
        time.sleep(0.1)  # Ensure timestamp difference
        updated_[resource] = update_[resource](session, [resource].id, {"field1": "updated"})

        # Assert
        assert updated_[resource].updated_at > original_updated_at

    def test_delete_[resource]_success(self, session: Session, user):
        """Test deleting a [resource] successfully"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()
        [resource]_id = [resource].id

        # Act
        delete_[resource](session, [resource]_id)

        # Assert
        result = session.get([ModelName], [resource]_id)
        assert result is None

    def test_delete_[resource]_not_found_raises_error(self, session: Session):
        """Test deleting non-existent [resource] raises error"""
        # Arrange
        non_existent_id = "non-existent-id"

        # Act & Assert
        with pytest.raises(ValueError, match="[Resource] not found"):
            delete_[resource](session, non_existent_id)

    def test_delete_[resource]_validates_user_id(self, session: Session, user):
        """Test deleting [resource] validates user ownership"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()

        # Act & Assert
        with pytest.raises(ValueError, match="Not authorized"):
            delete_[resource](session, [resource].id, user_id="other-user")

    def test_delete_[resource]_removes_from_database(self, session: Session, user):
        """Test deleted [resource] is removed from database"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()
        [resource]_id = [resource].id

        # Act
        delete_[resource](session, [resource]_id, user_id=user.id)

        # Assert - Query database directly
        statement = select([ModelName]).where([ModelName].id == [resource]_id)
        result = session.exec(statement).first()
        assert result is None

    def test_delete_[resource]_cascade_deletes_related(self, session: Session, user):
        """Test deleting [resource] cascades to related records"""
        # Arrange
        [resource] = [ModelName](field1="value1", field2="value2", user_id=user.id)
        session.add([resource])
        session.commit()

        # Add related records
        # related = RelatedModel([resource]_id=[resource].id)
        # session.add(related)
        # session.commit()

        # Act
        delete_[resource](session, [resource].id, user_id=user.id)

        # Assert
        # Verify related records are also deleted
        # statement = select(RelatedModel).where(RelatedModel.[resource]_id == [resource].id)
        # results = session.exec(statement).all()
        # assert len(results) == 0
