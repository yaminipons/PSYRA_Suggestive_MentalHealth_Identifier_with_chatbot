"""
Database connection and lifecycle management for PSYRA.
Uses Motor for async MongoDB access with graceful fallback for local development.
"""

import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from backend.config import settings

logger = logging.getLogger("psyra.database")


class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False
    
    # In-memory mock storage fallback when MongoDB server is not reachable
    _memory_users: Dict[str, Dict[str, Any]] = {}
    _memory_assessments: list = []
    _memory_journals: list = []

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000
            )
            # Ping database to verify connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            
            # Ensure indexes
            await self.db.users.create_index("email", unique=True)
            await self.db.assessments.create_index([("user_id", 1), ("created_at", -1)])
            await self.db.journals.create_index([("user_id", 1), ("created_at", -1)])
            logger.info("Connected successfully to MongoDB.")
        except Exception as e:
            logger.warning(
                f"Could not connect to external MongoDB ({e}). "
                "Running with in-memory persistence for local development and tests."
            )
            self.is_connected = False
            self.client = None
            self.db = None

    async def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB.")


db_manager = DatabaseManager()


def get_db():
    return db_manager.db
