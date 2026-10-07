A gallery of my personal bicycles.

Tech
- sveltkit
- supabase
note: you can checkout ../splitline/ to see examples of this tech

Auth
- un authenticated view will show the gallery contents and an option to login
- athenticated view accessed through supabase magic link through my email only (user provided)
- athenticated view allows me to add new bikes, delete bikes, edit details of each bike all done inline and no
t in a seperate view.

Date structure
- Bike
        - ID
        - Maker
        - Model
        - Year
        - Image (hosted in our db)
        - Description
        - Notes

UI
- Main view. Minimal grid layout of bike images.
- /bike-id Shows image and details below. By default the notes section is open and editiable in athenticated v
iew. Other details are editable if you click them.
