from datetime import timedelta
from faker import Faker
import random
from typing import List
from utilities import get_current_time
from db.models.user import User, UserSettings, ShowLocation, UserLocation, ContactInfo

fake = Faker()

def generate_fake_users(n: int) -> List[User]:
    users = []
    for _ in range(n):
        lat, long = generate_random_lat_long(59.26925456856207, 15.20632088460749, 0.01)
        user = User(
            userId=fake.random_int(min=1, max=1000),
            isMember=fake.boolean(),
            settings=UserSettings(
                show_location=fake.random_element(elements=(ShowLocation.ALL_MEMBERS, ShowLocation.ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION, ShowLocation.NO_ONE)),
                show_email=fake.boolean(),
                show_phone=fake.boolean(),
            ),
            location=UserLocation(
                latitude=lat,
                longitude=long,
                timestamp = random_time_last_day(),
                accuracy=fake.random_int(min=1, max=100)
            ) if fake.boolean() else None,
            contact_info=ContactInfo(
                email=fake.email(),
                phone=fake.phone_number()
            ) if fake.boolean() else None,
            age=fake.random_int(min=18, max=80) if fake.boolean() else None,
            slogan=fake.sentence() if fake.boolean() else None,
            avatar_url=f"https://picsum.photos/200?random={random.randint(1, 1000)}" if fake.boolean() else None,
            firstName=fake.first_name(),
            lastName=fake.last_name()
        )
        users.append(user)
    return users

def random_time_last_day():
    now = get_current_time()
    random_seconds = random.randint(0, 24*60*60)
    random_time = now - timedelta(seconds=random_seconds)
    return random_time.isoformat()

def generate_random_lat_long(center_lat, center_long, radius):
    offset_lat = random.uniform(-radius, radius)
    offset_long = random.uniform(-radius, radius)
    return center_lat + offset_lat, center_long + offset_long

latitude, longitude = generate_random_lat_long(59.26925456856207, 15.20632088460749, 0.01)