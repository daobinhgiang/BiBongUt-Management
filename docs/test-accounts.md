# Test Accounts

All accounts are on the hosted Supabase project (`bmyvkytdbarrfrkgsmak`).

## GNL VINA Family

Family ID: `3118dc18-fb98-4274-9a4c-d243e70a299f`

### Admin

| Nickname | Email               | Password    | User ID                                | Notes                        |
|----------|---------------------|-------------|----------------------------------------|------------------------------|
| Admin    | admin@bibongut.app  | Admin2026!  | 00000000-0000-0000-0000-ad0000000001   | is_admin=true in app_metadata |

### Parents

| Nickname  | Email                | Password      | User ID                                |
|-----------|----------------------|---------------|----------------------------------------|
| Bo Hoang  | bohoang@bibongut.app | BoHoang2026!  | 00000000-0000-0000-0000-eeeeeeeeeeee   |
| Me Nghia  | menghia@bibongut.app | MeNghia2026!  | 00000000-0000-0000-0000-ffffffffffff   |

### Children

| Nickname | Email              | Password    | User ID                                |
|----------|--------------------|-------------|----------------------------------------|
| Bi       | test@gmail.com     | (user-set)  | 391e67dd-fa5b-4c2f-b038-5267fc65bbb0   |
| Bong     | bong@bibongut.app  | Bong2026!   | 00000000-0000-0000-0000-cccccccccccc   |
| Ut       | ut@bibongut.app    | Ut2026!     | 00000000-0000-0000-0000-dddddddddddd   |

## Seed-file Users (local dev only)

| Name   | Email            | Password     | User ID                                | Role   |
|--------|------------------|--------------|----------------------------------------|--------|
| Parent | parent@test.com  | password123  | 00000000-0000-0000-0000-aaaaaaaaaaaa   | parent |
| Child  | child@test.com   | password123  | 00000000-0000-0000-0000-bbbbbbbbbbbb   | child  |

## Notes
- Family members are created directly in auth.users + auth.identities + family_members on hosted Supabase.
- The seed-file users (parent@test.com, child@test.com) only exist when running `supabase db reset` locally.
