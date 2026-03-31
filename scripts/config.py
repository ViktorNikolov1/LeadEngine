import os
from dotenv import load_dotenv

load_dotenv()

# Supabase
SUPABASE_URL: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

# Apify
APIFY_API_TOKEN: str = os.environ.get("APIFY_API_TOKEN", "")
APIFY_ACTOR_ID: str = os.environ.get("APIFY_ACTOR_ID", "IoSHqwTR9YGhzccez")

# Scraping defaults
DEFAULT_SCRAPE_LIMIT: int = 10
REQUEST_DELAY_MIN: float = 1.0
REQUEST_DELAY_MAX: float = 3.0
