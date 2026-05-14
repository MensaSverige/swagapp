from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from v1.request_filter import validate_request

profile_options_v1 = APIRouter(prefix="/v1")


class ProfileOptionItem(BaseModel):
    value: str
    label: str
    icon: str


class ProfileOptionCategory(BaseModel):
    key: str
    label: str
    multi: bool
    items: List[ProfileOptionItem]


PROFILE_OPTION_CATEGORIES: List[ProfileOptionCategory] = [
    ProfileOptionCategory(key='gender', label='Kön', multi=False, items=[
        ProfileOptionItem(value='male',   label='Man',    icon='man'),
        ProfileOptionItem(value='female', label='Kvinna', icon='woman'),
        ProfileOptionItem(value='other',  label='Annat',  icon='man-4'),
    ]),
    ProfileOptionCategory(key='sexuality', label='Läggning', multi=False, items=[
        ProfileOptionItem(value='hetero',   label='Heterosexuell',                   icon='straight'),
        ProfileOptionItem(value='homo',        label='Homosexuell',                  icon='turn-sharp-right'),
        ProfileOptionItem(value='bi_pan',     label='Bisexuell/Pansexuell',       icon='loop'),
        ProfileOptionItem(value='asexual',    label='Asexuell',                   icon='panorama-fish-eye'),
    ]),
    ProfileOptionCategory(key='relationship_style', label='Relationsform', multi=False, items=[
        ProfileOptionItem(value='monogamous', label='Monogam',          icon='keyboard-command-key'),
        ProfileOptionItem(value='poly',        label='Flersam', icon='diversity-1'),
    ]),
    ProfileOptionCategory(key='relationship_status', label='Relationsstatus', multi=False, items=[
        ProfileOptionItem(value='single',         label='Singel',               icon='favorite-border'),
        ProfileOptionItem(value='has_partner',         label='Har partner',       icon='favorite'),
    ]),
    ProfileOptionCategory(key='social_vibes', label='Socialt', multi=True, items=[
        ProfileOptionItem(value='come_say_hi', label='Säg gärna hej', icon='waving-hand'),
        ProfileOptionItem(value='include_me', label='Inkludera mig gärna', icon='group-add'),
        ProfileOptionItem(value='new_here', label='Jag är ny här', icon='explore'),
        ProfileOptionItem(value='slow_warmup', label='Tar lite tid att komma igång', icon='hourglass-top'),
        ProfileOptionItem(value='prefer_small_groups', label='Föredrar små grupper', icon='groups-2'),
        ProfileOptionItem(value='mostly_listening', label='Lyssnar mest idag', icon='hearing'),
        ProfileOptionItem(value='no_touch', label='Ingen fysisk kontakt tack', icon='do-not-touch'),
        ProfileOptionItem(value='taking_break', label='Tar en social paus', icon='pause-circle'),
    ])
]


@profile_options_v1.get("/profile-options", response_model=List[ProfileOptionCategory])
async def get_profile_option_categories(current_user: dict = Depends(validate_request)):
    return PROFILE_OPTION_CATEGORIES
