from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from v1.db.models.user import UserInterest
from v1.request_filter import validate_request

interests_v1 = APIRouter(prefix="/v1")


class InterestCategory(BaseModel):
    category: str
    items: List[UserInterest]


INTEREST_CATEGORIES: List[InterestCategory] = [
    InterestCategory(category='Konst och hantverk', items=[
        UserInterest.KONST, UserInterest.TEATER, UserInterest.SLOJD_HANDARBETE,
        UserInterest.PYSSEL, UserInterest.FOTOGRAFI, UserInterest.SKRIVANDE,
        UserInterest.INREDNINGSDESIGN, UserInterest.LOPPIS,
    ]),
    InterestCategory(category='Musik', items=[
        UserInterest.SPELA_INSTRUMENT, UserInterest.SJUNGA,
        UserInterest.PRODUCERA_MUSIK, UserInterest.KONSERT, UserInterest.LYSSNA_MUSIK,
    ]),
    InterestCategory(category='Sport och fysisk aktivitet', items=[
        UserInterest.BOLLSPORT, UserInterest.IDROTT, UserInterest.MOTORSPORT,
        UserInterest.SKIDOR, UserInterest.LOPNING, UserInterest.KONDITIONSTRANING,
        UserInterest.KAMPSPORT, UserInterest.HASTSPORT, UserInterest.KLATTRING,
        UserInterest.DYKNING, UserInterest.GYM, UserInterest.YOGA,
        UserInterest.GOLF, UserInterest.DANS,
    ]),
    InterestCategory(category='Film och underhållning', items=[
        UserInterest.BOCKER, UserInterest.FILM_TV, UserInterest.FEST,
        UserInterest.TVSPEL, UserInterest.BRADSPEL, UserInterest.KORTSPEL,
    ]),
    InterestCategory(category='Djur och natur', items=[
        UserInterest.ODLING, UserInterest.BOTANIK, UserInterest.LANTBRUK,
        UserInterest.FRILUFTSLIV, UserInterest.VANDRING, UserInterest.HUSDJUR,
        UserInterest.ZOOLOGI, UserInterest.CAMPING, UserInterest.FISKE,
        UserInterest.FAGELSKADNING,
    ]),
    InterestCategory(category='Teknologi och Vetenskap', items=[
        UserInterest.PROGRAMMERING, UserInterest.ELEKTRONIK, UserInterest.TEKNIKPRYLAR,
        UserInterest.VETENSKAP, UserInterest.MATEMATIK, UserInterest.ASTRONOMI,
        UserInterest.AKADEMISKA_STUDIER, UserInterest.LIVSLANGT_LARANDE,
        UserInterest.HISTORIA, UserInterest.LASNING,
    ]),
    InterestCategory(category='Ekonomi och Entreprenörskap', items=[
        UserInterest.FONDER_AKTIER, UserInterest.FORETAGANDE,
    ]),
    InterestCategory(category='Kultur och samhälle', items=[
        UserInterest.POLITIK, UserInterest.KULTUR, UserInterest.SPRAK, UserInterest.RESOR,
    ]),
    InterestCategory(category='Filosofi och spiritualitet', items=[
        UserInterest.FILOSOFI, UserInterest.PSYKOLOGI, UserInterest.PERSONLIG_UTVECKLING,
        UserInterest.RELIGION, UserInterest.MEDITATION,
    ]),
    InterestCategory(category='Relationer och samlevnad', items=[
        UserInterest.SEX_SEXUALITET, UserInterest.RELATIONER, UserInterest.FORALDRASKAP,
    ]),
    InterestCategory(category='Mat och dryck', items=[
        UserInterest.RESTAURANG, UserInterest.MATLAGNING, UserInterest.BAKNING,
        UserInterest.OL, UserInterest.WHISKY, UserInterest.VIN,
    ]),
    InterestCategory(category='Stil och skönhet', items=[
        UserInterest.KLADER, UserInterest.HAR_MAKEUP,
    ]),
    InterestCategory(category='Övrigt', items=[
        UserInterest.ATERBRUK, UserInterest.PREPPING,
        UserInterest.SJALVHUSHALL, UserInterest.BYGG_RENOVERING,
    ]),
]


@interests_v1.get("/interests", response_model=List[InterestCategory])
async def get_interest_categories(current_user: dict = Depends(validate_request)):
    return INTEREST_CATEGORIES
