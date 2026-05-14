# VTA Tennis Club — Admin Panel & Member Portal

## Context
Build a web application for a tennis club that provides:
- A member-facing portal where users register/login and view their membership details
- An admin panel for managing all member records and exporting data
- A PostgreSQL membership database

Tech stack: Django + PostgreSQL (blank slate project at `/Users/pwiens/Documents/Claude/Projects/VTA`).

---

## Project Structure

```
VTA/
├── .env                        # Secrets (gitignored)
├── .gitignore
├── requirements.txt
├── manage.py
├── config/                     # Django project package
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/                   # Custom User model + auth views
│   ├── models.py               # CustomUser (email as USERNAME_FIELD)
│   ├── forms.py                # RegistrationForm, LoginForm
│   ├── views.py                # register, login_view, logout_view
│   └── urls.py
├── members/                    # Membership data + portal
│   ├── models.py               # MemberProfile (OneToOne -> CustomUser)
│   ├── admin.py                # ModelAdmin + CSV export action
│   ├── views.py                # dashboard (login_required)
│   └── urls.py
└── templates/
    ├── base.html               # Shared layout (Bootstrap 5 via CDN)
    ├── accounts/
    │   ├── register.html
    │   └── login.html
    └── members/
        └── dashboard.html
```

---

## Database Models

### `accounts.CustomUser` (extends AbstractBaseUser)
| Field | Type |
|---|---|
| email | EmailField (unique, USERNAME_FIELD) |
| first_name | CharField |
| last_name | CharField |
| is_active | BooleanField |
| is_staff | BooleanField |
| date_joined | DateTimeField |

`AUTH_USER_MODEL = 'accounts.CustomUser'` — **must be set before first migration.**

### `members.MemberProfile` (OneToOne → CustomUser)
| Field | Type |
|---|---|
| user | OneToOneField(CustomUser) |
| phone | CharField |
| street | CharField |
| city | CharField |
| state | CharField |
| zip_code | CharField |
| membership_start | DateField |
| membership_expiry | DateField |
| payment_status | CharField (TextChoices: paid/unpaid/pending) |
| level | DecimalField (max_digits=2, decimal_places=1, choices: 1.0–5.0 in 0.5 steps, blank=True) |

Level choices defined as a tuple: `[(Decimal('1.0'), '1.0'), (Decimal('1.5'), '1.5'), ..., (Decimal('5.0'), '5.0')]`

MemberProfile is auto-created via a `post_save` signal on CustomUser.

---

## URL Routes

| URL | View | Name |
|---|---|---|
| `/accounts/register/` | accounts.views.register | register |
| `/accounts/login/` | accounts.views.login_view | login |
| `/accounts/logout/` | accounts.views.logout_view | logout |
| `/members/dashboard/` | members.views.dashboard | member_dashboard |
| `/admin/` | Django admin | — |
| `/` | Redirect (dashboard or login) | — |

---

## Key Views & Forms

### accounts app
- **RegistrationForm**: extends UserCreationForm for CustomUser (email, first_name, last_name, password); includes `level` field from MemberProfile as a Select widget with choices 1.0–5.0
- **register view**: validates form → creates user → creates MemberProfile with `level` saved from form → logs in → redirects to dashboard
- **login_view**: wraps `django.contrib.auth.authenticate` + `login`
- **logout_view**: calls `django.contrib.auth.logout` → redirects to login

### members app
- **dashboard view** (`@login_required`): fetches `request.user.profile`, renders read-only membership details
- Admin manages all create/edit/delete via `/admin/`

---

## Admin Panel (`members/admin.py`)

- `@admin.register(MemberProfile)` with `list_display`, `list_filter`, `search_fields`
- **CSV export action**: Django admin action that streams all selected member records as a downloadable `.csv` file using Python's built-in `csv` module (no extra packages needed)
- Columns: First Name, Last Name, Email, Phone, Street, City, State, Zip, Start Date, Expiry Date, Payment Status, Level

---

## Packages (`requirements.txt`)

```
Django>=4.2,<5.0
psycopg2-binary>=2.9
python-decouple>=3.8
```

`python-decouple` reads `.env` so secrets never touch source code.

---

## Setup Sequence (critical order)

1. Create virtualenv, install packages, `pip freeze > requirements.txt`
2. `django-admin startproject config .`
3. `python manage.py startapp accounts` and `startapp members`
4. **Set `AUTH_USER_MODEL = 'accounts.CustomUser'` in `settings.py` BEFORE any migrations**
5. Add apps to `INSTALLED_APPS`, configure DB from `.env`, set `TEMPLATES DIRS`, `LOGIN_URL`, `LOGIN_REDIRECT_URL`
6. Write `CustomUser` + `CustomUserManager` → `makemigrations accounts`
7. Write `MemberProfile` + signal → `makemigrations members`
8. `python manage.py migrate`
9. Wire up all URLs, write views, forms, templates
10. Configure `MemberProfileAdmin` with CSV action
11. `python manage.py createsuperuser`
12. `python manage.py runserver`

---

## Verification

- Register a new account → verify redirect to dashboard showing blank profile
- Log out → log back in → verify dashboard loads
- Visit `/admin/` as superuser → add/edit/delete a member record
- Select members in admin list → run "Export selected members as CSV" action → verify download
- Attempt to visit `/members/dashboard/` while logged out → verify redirect to login
