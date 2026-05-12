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
    # ProfileOptionCategory(key='social_flags', label='Socialt', multi=True, items=[
    #     ProfileOptionItem(value='ask_if_new',     label='Fråga mig om du är ny',            icon='live-help'),
    #     ProfileOptionItem(value='no_hugs',        label='Krama mig inte',                   icon='do-not-touch'),
    #     ProfileOptionItem(value='personal_space', label='Respektera mitt personliga space', icon='security'),
    #     ProfileOptionItem(value='talk_to_me',     label='Prata med mig',                    icon='chat'),
    #     ProfileOptionItem(value='no_interact',    label='Interagera inte med mig',          icon='do-not-disturb-on'),
    # ]),
]


@profile_options_v1.get("/profile-options", response_model=List[ProfileOptionCategory])
async def get_profile_option_categories(current_user: dict = Depends(validate_request)):
    return PROFILE_OPTION_CATEGORIES
