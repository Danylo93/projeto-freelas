from src.core.domain.entity import Entity
from src.modules.identity.domain.entities import User, UserType
import unittest

class TestDomain(unittest.TestCase):
    def test_entity_creation(self):
        e = Entity()
        self.assertIsNotNone(e.id)
        self.assertIsNotNone(e.created_at)

    def test_user_creation(self):
        u = User(
            name="Test",
            email="test@example.com",
            phone="123",
            password_hash="hash",
            user_type=UserType.CLIENTE
        )
        self.assertEqual(u.name, "Test")
        self.assertEqual(u.user_type, UserType.CLIENTE)

if __name__ == '__main__':
    unittest.main()
