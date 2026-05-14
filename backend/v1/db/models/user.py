from enum import Enum
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class UserLocation(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[datetime]
    accuracy: float  # Accuracy in meters


class UserInterest(str, Enum):
    KONST = 'Konst'
    TEATER = 'Teater'
    SLOJD_HANDARBETE = 'Slöjd och handarbete'
    PYSSEL = 'Pyssel'
    FOTOGRAFI = 'Fotografi'
    SKRIVANDE = 'Skrivande'
    INREDNINGSDESIGN = 'Inredningsdesign'
    LOPPIS = 'Loppis och second hand'
    SPELA_INSTRUMENT = 'Spela instrument'
    SJUNGA = 'Sjunga'
    PRODUCERA_MUSIK = 'Producera musik'
    KONSERT = 'Gå på konsert'
    LYSSNA_MUSIK = 'Lyssna på musik'
    BOLLSPORT = 'Bollsport'
    IDROTT = 'Idrott'
    MOTORSPORT = 'Motorsport'
    SKIDOR = 'Skidor och vintersport'
    LOPNING = 'Löpning'
    KONDITIONSTRANING = 'Konditionsträning'
    KAMPSPORT = 'Kampsport'
    HASTSPORT = 'Hästsport'
    KLATTRING = 'Klättring/Bouldering'
    DYKNING = 'Dykning'
    GYM = 'Gym'
    YOGA = 'Yoga'
    GOLF = 'Golf'
    DANS = 'Dans'
    BOCKER = 'Böcker och litteratur'
    FILM_TV = 'Film och tv-serier'
    FEST = 'Fest'
    TVSPEL = 'Tv-spel/datorspel'
    BRADSPEL = 'Brädspel'
    KORTSPEL = 'Kortspel'
    ODLING = 'Odling och trädgårdsarbete'
    BOTANIK = 'Botanik'
    LANTBRUK = 'Lantbruk'
    FRILUFTSLIV = 'Friluftsliv'
    VANDRING = 'Vandring och hiking'
    HUSDJUR = 'Husdjur'
    ZOOLOGI = 'Zoologi'
    CAMPING = 'Camping'
    FISKE = 'Fiske'
    FAGELSKADNING = 'Fågelskådning'
    PROGRAMMERING = 'Programmering och IT'
    ELEKTRONIK = 'Elektronik'
    TEKNIKPRYLAR = 'Teknikprylar'
    VETENSKAP = 'Vetenskap och forskning'
    MATEMATIK = 'Matematik'
    ASTRONOMI = 'Astronomi'
    AKADEMISKA_STUDIER = 'Akademiska studier'
    LIVSLANGT_LARANDE = 'Livslångt lärande'
    HISTORIA = 'Historia'
    LASNING = 'Läsning'
    FONDER_AKTIER = 'Fonder och Aktier'
    FORETAGANDE = 'Företagande och entreprenörskap'
    POLITIK = 'Politik'
    KULTUR = 'Kultur'
    SPRAK = 'Språk'
    RESOR = 'Resor'
    FILOSOFI = 'Filosofi'
    PSYKOLOGI = 'Psykologi'
    PERSONLIG_UTVECKLING = 'Personlig utveckling'
    RELIGION = 'Religion'
    MEDITATION = 'Meditation'
    SEX_SEXUALITET = 'Sex och sexualitet'
    RELATIONER = 'Relationer och relationstyper'
    FORALDRASKAP = 'Föräldraskap och uppfostran'
    RESTAURANG = 'Restaurang och matupplevelser'
    MATLAGNING = 'Matlagning'
    BAKNING = 'Bakning'
    OL = 'Öl'
    WHISKY = 'Whisky'
    VIN = 'Vin'
    KLADER = 'Kläder och personlig stil'
    HAR_MAKEUP = 'Hår och makeup'
    ATERBRUK = 'Återbruk'
    PREPPING = 'Prepping'
    SJALVHUSHALL = 'Självhushåll'
    BYGG_RENOVERING = 'Bygg och renovering'


class PrivacySetting(str, Enum):
    NO_ONE          = 'NO_ONE'
    MEMBERS_ONLY    = 'MEMBERS_ONLY'
    MEMBERS_MUTUAL  = 'MEMBERS_MUTUAL'
    EVERYONE_MUTUAL = 'EVERYONE_MUTUAL'
    EVERYONE        = 'EVERYONE'


_LEGACY_LOCATION_RENAMES = {
    "ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION": "MEMBERS_MUTUAL",
    "ALL_MEMBERS": "MEMBERS_ONLY",
    "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION": "EVERYONE_MUTUAL",
}


class UserSettings(BaseModel):
    show_location: PrivacySetting = Field(default=PrivacySetting.NO_ONE,
                                          example=PrivacySetting.EVERYONE)
    show_profile: PrivacySetting = Field(default=PrivacySetting.MEMBERS_ONLY,
                                         example=PrivacySetting.MEMBERS_ONLY)
    show_email: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)
    show_phone: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)

    location_update_interval_seconds: int = Field(default=60, example=60, description="Location update interval in seconds")
    events_refresh_interval_seconds: int = Field(default=60, example=60, description="Events refresh interval in seconds")

    background_location_updates: bool = Field(default=False, example=True, description="Allow location updates when app is in background")
    show_interests: PrivacySetting = Field(default=PrivacySetting.MEMBERS_ONLY, example=PrivacySetting.MEMBERS_ONLY)
    show_hometown: PrivacySetting = Field(default=PrivacySetting.MEMBERS_ONLY, example=PrivacySetting.MEMBERS_ONLY)
    show_birthdate: PrivacySetting = Field(default=PrivacySetting.MEMBERS_ONLY, example=PrivacySetting.MEMBERS_ONLY)
    show_gender: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)
    show_sexuality: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)
    show_relationship_style: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)
    show_relationship_status: PrivacySetting = Field(default=PrivacySetting.NO_ONE, example=PrivacySetting.MEMBERS_ONLY)
    show_social_vibes: PrivacySetting = Field(default=PrivacySetting.MEMBERS_ONLY, example=PrivacySetting.MEMBERS_ONLY)

    @field_validator("show_location", mode="before")
    @classmethod
    def _coerce_show_location(cls, v):
        if isinstance(v, str):
            return _LEGACY_LOCATION_RENAMES.get(v, v)
        return v

    @field_validator("show_email", "show_phone", mode="before")
    @classmethod
    def _coerce_bool_privacy(cls, v):
        if isinstance(v, bool):
            return "MEMBERS_ONLY" if v else "NO_ONE"
        return v


class ContactInfo(BaseModel):
    email: Optional[str] = Field(None, example="johndoe@example.com")
    phone: Optional[str] = Field(None, example="+1234567890")


class User(BaseModel):
    userId: int = Field(..., example=123)
    isMember: bool = Field(default=False, example=True)
    settings: UserSettings
    location: Optional[UserLocation] = Field(None,
                                             example={
                                                 "latitude": 37.7749,
                                                 "longitude": -122.4194,
                                                 "timestamp": "2021-01-01",
                                                 "accuracy": 10
                                             })
    contact_info: Optional[ContactInfo] = Field(None,
                                                example={
                                                    "email":
                                                    "johndoe@example.com",
                                                    "phone": "+1234567890"
                                                })
    age: Optional[int] = Field(None, example=30)
    slogan: Optional[str] = Field(None, example="Live and Let Live")
    avatar_url: Optional[str] = Field(None,
                                      example="https://example.com/avatar.jpg")
    firstName: Optional[str] = Field(None, example="John Doe")
    lastName: Optional[str] = Field(None, example="John Doe")
    interests: List[UserInterest] = Field(default_factory=list, example=[])
    hometown: Optional[str] = Field(None, example="Stockholm")
    birthdate: Optional[str] = Field(None, example="1989-11-15")
    gender: Optional[str] = Field(None, example="male")
    sexuality: Optional[str] = Field(None, example="straight")
    relationship_style: Optional[str] = Field(None, example="monogamous")
    relationship_status: Optional[str] = Field(None, example="has_partner")
    social_vibes: List[str] = Field(default_factory=list, example=[])


class UserUpdate(BaseModel):
    settings: UserSettings
    contact_info: Optional[ContactInfo] = Field(None,
                                                example={
                                                    "email":
                                                    "johndoe@example.com",
                                                    "phone": "+1234567890"
                                                })
    slogan: Optional[str] = Field(None, example="Live and Let Live")
    interests: Optional[List[UserInterest]] = Field(None, example=[])
    hometown: Optional[str] = Field(None, example="Stockholm")
    birthdate: Optional[str] = Field(None, example="1989-11-15")
    gender: Optional[str] = Field(None, example="male")
    sexuality: Optional[str] = Field(None, example="straight")
    relationship_style: Optional[str] = Field(None, example="monogamous")
    relationship_status: Optional[str] = Field(None, example="has_partner")
    social_vibes: Optional[List[str]] = Field(None, example=[])
