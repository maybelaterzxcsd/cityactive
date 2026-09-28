from sqlalchemy import Column, String, Integer, Boolean, Text
from database import Base


class EventDB(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    date = Column(String)
    location = Column(String)
    price = Column(Integer)

    max_participants = Column(Integer)
    participants_count = Column(Integer, default=0)
    volunteers_count = Column(Integer, default=0)

    organizer = Column(String)
    category = Column(String)
    category_ru = Column(String)
    age_restriction = Column(Integer)

    needs_volunteers = Column(Boolean, default=False)
    distance = Column(String)
    image = Column(String, nullable=True)

    participants = Column(Text, default="[]")


class UserDB(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    volunteer_hours = Column(Integer, default=0)
    badges = Column(Text, default="[]")