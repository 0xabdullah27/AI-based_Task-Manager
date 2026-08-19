"""
Test: [ModelName] SQLModel

Spec: [spec-id]
Task: [task-id]

Tests [ModelName] database model following TDD principles.
Coverage target: 70%+
"""

import pytest
from datetime import datetime
from sqlmodel import Session, select
from app.models.[model_module] import [ModelName]


class Test[ModelName]Model:
    """Test suite for [ModelName] database model"""

    def test_create_[model_name]_with_required_fields(self, session: Session):
        """Test creating [model_name] with all required fields"""
        # Arrange
        [model_name]_data = {
            "field1": "value1",
            "field2": "value2",
            # Add required fields
        }

        # Act
        [model_name] = [ModelName](**[model_name]_data)
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Assert
        assert [model_name].id is not None
        assert [model_name].field1 == [model_name]_data["field1"]
        assert [model_name].field2 == [model_name]_data["field2"]
        assert isinstance([model_name].created_at, datetime)

    def test_create_[model_name]_with_optional_fields(self, session: Session):
        """Test creating [model_name] with optional fields"""
        # Arrange
        [model_name]_data = {
            "field1": "value1",
            "field2": "value2",
            "optional_field": "optional_value",
        }

        # Act
        [model_name] = [ModelName](**[model_name]_data)
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Assert
        assert [model_name].optional_field == "optional_value"

    def test_create_[model_name]_without_optional_fields(self, session: Session):
        """Test creating [model_name] without optional fields uses defaults"""
        # Arrange
        [model_name]_data = {
            "field1": "value1",
            "field2": "value2",
        }

        # Act
        [model_name] = [ModelName](**[model_name]_data)
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Assert
        assert [model_name].optional_field is None  # or default value

    def test_[model_name]_id_auto_generated(self, session: Session):
        """Test [model_name] ID is automatically generated"""
        # Arrange
        [model_name] = [ModelName](field1="value1", field2="value2")

        # Act
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Assert
        assert [model_name].id is not None
        assert isinstance([model_name].id, str)  # or int, depending on type

    def test_[model_name]_timestamps_auto_generated(self, session: Session):
        """Test created_at and updated_at timestamps are automatically set"""
        # Arrange
        [model_name] = [ModelName](field1="value1", field2="value2")

        # Act
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Assert
        assert [model_name].created_at is not None
        assert isinstance([model_name].created_at, datetime)
        assert [model_name].updated_at is not None
        assert isinstance([model_name].updated_at, datetime)

    def test_update_[model_name]_updates_timestamp(self, session: Session):
        """Test updating [model_name] updates the updated_at timestamp"""
        # Arrange
        [model_name] = [ModelName](field1="value1", field2="value2")
        session.add([model_name])
        session.commit()
        session.refresh([model_name])
        original_updated_at = [model_name].updated_at

        # Act
        [model_name].field1 = "updated_value"
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Assert
        assert [model_name].updated_at > original_updated_at

    def test_[model_name]_unique_constraint(self, session: Session):
        """Test unique constraint on [field] is enforced"""
        # Arrange
        [model_name]1 = [ModelName](field1="unique_value", field2="value2")
        session.add([model_name]1)
        session.commit()

        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError or similar
            [model_name]2 = [ModelName](field1="unique_value", field2="value3")
            session.add([model_name]2)
            session.commit()

    def test_[model_name]_foreign_key_relationship(self, session: Session, user):
        """Test foreign key relationship to User"""
        # Arrange
        [model_name] = [ModelName](
            field1="value1",
            field2="value2",
            user_id=user.id
        )

        # Act
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Assert
        assert [model_name].user_id == user.id
        # If relationship is defined:
        # assert [model_name].user.id == user.id

    def test_[model_name]_foreign_key_cascade_delete(self, session: Session, user):
        """Test cascade delete when user is deleted"""
        # Arrange
        [model_name] = [ModelName](
            field1="value1",
            field2="value2",
            user_id=user.id
        )
        session.add([model_name])
        session.commit()
        [model_name]_id = [model_name].id

        # Act
        session.delete(user)
        session.commit()

        # Assert
        result = session.get([ModelName], [model_name]_id)
        assert result is None  # Should be deleted due to cascade

    def test_query_[model_name]_by_field(self, session: Session):
        """Test querying [model_name] by field"""
        # Arrange
        [model_name]1 = [ModelName](field1="value1", field2="test")
        [model_name]2 = [ModelName](field1="value2", field2="test")
        [model_name]3 = [ModelName](field1="value3", field2="other")
        session.add([model_name]1)
        session.add([model_name]2)
        session.add([model_name]3)
        session.commit()

        # Act
        statement = select([ModelName]).where([ModelName].field2 == "test")
        results = session.exec(statement).all()

        # Assert
        assert len(results) == 2
        assert all(r.field2 == "test" for r in results)

    def test_query_[model_name]_with_multiple_filters(self, session: Session, user):
        """Test querying [model_name] with multiple filters"""
        # Arrange
        [model_name]1 = [ModelName](field1="value1", field2="test", user_id=user.id)
        [model_name]2 = [ModelName](field1="value2", field2="test", user_id=user.id)
        [model_name]3 = [ModelName](field1="value3", field2="other", user_id=user.id)
        session.add_all([[model_name]1, [model_name]2, [model_name]3])
        session.commit()

        # Act
        statement = select([ModelName]).where(
            [ModelName].user_id == user.id,
            [ModelName].field2 == "test"
        )
        results = session.exec(statement).all()

        # Assert
        assert len(results) == 2

    def test_[model_name]_ordering(self, session: Session):
        """Test ordering [model_name] records"""
        # Arrange
        [model_name]1 = [ModelName](field1="C", field2="value")
        [model_name]2 = [ModelName](field1="A", field2="value")
        [model_name]3 = [ModelName](field1="B", field2="value")
        session.add_all([[model_name]1, [model_name]2, [model_name]3])
        session.commit()

        # Act
        statement = select([ModelName]).order_by([ModelName].field1)
        results = session.exec(statement).all()

        # Assert
        assert results[0].field1 == "A"
        assert results[1].field1 == "B"
        assert results[2].field1 == "C"

    def test_[model_name]_pagination(self, session: Session):
        """Test paginating [model_name] records"""
        # Arrange
        for i in range(10):
            [model_name] = [ModelName](field1=f"value{i}", field2="test")
            session.add([model_name])
        session.commit()

        # Act
        statement = select([ModelName]).offset(5).limit(3)
        results = session.exec(statement).all()

        # Assert
        assert len(results) == 3

    def test_update_[model_name]_field(self, session: Session):
        """Test updating a [model_name] field"""
        # Arrange
        [model_name] = [ModelName](field1="original", field2="value")
        session.add([model_name])
        session.commit()
        [model_name]_id = [model_name].id

        # Act
        [model_name].field1 = "updated"
        session.add([model_name])
        session.commit()

        # Assert
        updated_[model_name] = session.get([ModelName], [model_name]_id)
        assert updated_[model_name].field1 == "updated"

    def test_delete_[model_name](self, session: Session):
        """Test deleting a [model_name]"""
        # Arrange
        [model_name] = [ModelName](field1="value1", field2="value2")
        session.add([model_name])
        session.commit()
        [model_name]_id = [model_name].id

        # Act
        session.delete([model_name])
        session.commit()

        # Assert
        result = session.get([ModelName], [model_name]_id)
        assert result is None

    def test_[model_name]_count(self, session: Session):
        """Test counting [model_name] records"""
        # Arrange
        for i in range(5):
            session.add([ModelName](field1=f"value{i}", field2="test"))
        session.commit()

        # Act
        from sqlalchemy import func
        statement = select(func.count([ModelName].id))
        count = session.exec(statement).one()

        # Assert
        assert count == 5

    def test_[model_name]_field_validation(self):
        """Test field validation on model creation"""
        # Arrange & Act & Assert
        with pytest.raises(ValueError):
            [ModelName](
                field1="",  # Invalid empty value
                field2="value2"
            )

    def test_[model_name]_field_max_length(self):
        """Test field max length validation"""
        # Arrange & Act & Assert
        with pytest.raises(ValueError):
            [ModelName](
                field1="a" * 300,  # Exceeds max length of 200
                field2="value2"
            )

    def test_[model_name]_string_representation(self, session: Session):
        """Test string representation of [model_name]"""
        # Arrange
        [model_name] = [ModelName](field1="value1", field2="value2")

        # Act
        result = str([model_name])

        # Assert
        assert "value1" in result
        assert "[ModelName]" in result

    def test_[model_name]_json_serialization(self, session: Session):
        """Test [model_name] can be serialized to JSON"""
        # Arrange
        [model_name] = [ModelName](field1="value1", field2="value2")
        session.add([model_name])
        session.commit()
        session.refresh([model_name])

        # Act
        json_data = [model_name].model_dump()

        # Assert
        assert json_data["field1"] == "value1"
        assert json_data["field2"] == "value2"
        assert "id" in json_data
        assert "created_at" in json_data
