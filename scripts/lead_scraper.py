import random
import time
from apify_client import ApifyClient
from dotenv import load_dotenv
from db import get_supabase_client
from config import APIFY_API_TOKEN, APIFY_ACTOR_ID, REQUEST_DELAY_MIN, REQUEST_DELAY_MAX

load_dotenv(".env.local")

# Initialize Apify Client
if not APIFY_API_TOKEN:
    raise ValueError("APIFY_API_TOKEN is not set")

apify_client = ApifyClient(APIFY_API_TOKEN)
supabase = get_supabase_client()

if not APIFY_ACTOR_ID:
    raise ValueError("APIFY_ACTOR_ID is not set")


def run_prospect_scraper(
    fetch_count: int = 10,
    job_title: str | None = None,
    exclude_job_title: str | None = None,
    seniority_level: str | None = None,
    contact_location: str | None = None,
    contact_city: str | None = None,
    exclude_location: str | None = None,
    exclude_city: str | None = None,
    email_status: list[str] | None = None,
    company_domain: str | None = None,
    size: str | None = None,
    industry: str | None = None,
    exclude_industry: str | None = None,
    company_keywords: str | None = None,
    exclude_company_keywords: str | None = None,
    min_revenue: int | None = None,
    max_revenue: int | None = None,
    funding: str | None = None,
) -> list[dict]:
    """
    Runs the Apify prospect scraper actor (IoSHqwTR9YGhzccez).
    Uses filter-based input to find contacts from a B2B database.
    """
    print(f"Starting prospect scrape: job_title={job_title}, location={contact_location}, fetch_count={fetch_count}")

    run_input = {
        "fetch_count": fetch_count,
        "file_name": "Prospects",
        "contact_job_title": job_title,
        "contact_not_job_title": exclude_job_title,
        "seniority_level": seniority_level,
        "functional_level": None,
        "contact_location": contact_location,
        "contact_city": contact_city,
        "contact_not_location": exclude_location,
        "contact_not_city": exclude_city,
        "email_status": email_status or ["validated"],
        "company_domain": company_domain,
        "size": size,
        "company_industry": industry,
        "company_not_industry": exclude_industry,
        "company_keywords": company_keywords,
        "company_not_keywords": exclude_company_keywords,
        "min_revenue": min_revenue,
        "max_revenue": max_revenue,
        "funding": funding,
    }

    try:
        run = apify_client.actor(APIFY_ACTOR_ID).call(run_input=run_input)
        dataset_items = apify_client.dataset(run["defaultDatasetId"]).list_items().items
        print(f"Apify returned {len(dataset_items)} results")
        return dataset_items
    except Exception as e:
        print(f"Apify scraper error: {e}")
        return []


def normalize_lead(raw: dict) -> dict:
    """
    Normalizes raw Apify output into the lead schema format.
    Handles field name variations from the prospect database actor.
    """
    linkedin_url = (
        raw.get("linkedin_url")
        or raw.get("linkedInUrl")
        or raw.get("linkedin")
        or raw.get("profileUrl")
        or raw.get("url")
        or raw.get("person_linkedin_url")
        or ""
    )
    email = raw.get("email") or raw.get("contact_email")

    first_name = raw.get("first_name") or raw.get("firstName") or raw.get("contact_first_name")
    last_name = raw.get("last_name") or raw.get("lastName") or raw.get("contact_last_name")
    full_name = (
        raw.get("full_name")
        or raw.get("fullName")
        or raw.get("name")
        or raw.get("contact_name")
        or f"{first_name or ''} {last_name or ''}".strip()
    )

    return {
        "linkedin_url": linkedin_url or (f"apify:{email}" if email else ""),
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name or None,
        "headline": raw.get("headline") or raw.get("title") or raw.get("contact_title"),
        "location": raw.get("location") or raw.get("contact_location") or raw.get("addressLocality") or raw.get("city"),
        "company_name": raw.get("company_name") or raw.get("companyName") or raw.get("company") or raw.get("organization_name"),
        "job_title": raw.get("job_title") or raw.get("jobTitle") or raw.get("position") or raw.get("contact_title") or raw.get("title"),
        "email": email,
        "enrichment_data": raw,
    }


def save_leads(leads: list, campaign_id: str = None):
    """
    Saves leads to Supabase, handling deduplication via linkedin_url upsert.
    """
    results = []
    for raw_lead in leads:
        lead = normalize_lead(raw_lead)

        if not lead["linkedin_url"]:
            print(f"Skipping lead without LinkedIn URL or email: {lead.get('full_name', 'unknown')}")
            continue

        lead["campaign_id"] = campaign_id

        try:
            response = supabase.table("leads").upsert(
                lead, on_conflict="linkedin_url"
            ).execute()
            results.append(response)
            print(f"Saved: {lead.get('full_name')}")
        except Exception as e:
            print(f"Error saving {lead.get('full_name')}: {e}")

        # Rate limit: jitter delay between writes
        time.sleep(random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX))

    return results


def log_run(campaign_id: str, apify_run_id: str, leads_count: int, status: str):
    """
    Logs the scraping run to the runs table.
    """
    try:
        supabase.table("runs").insert({
            "campaign_id": campaign_id,
            "apify_run_id": apify_run_id,
            "leads_processed": leads_count,
            "status": status,
        }).execute()
    except Exception as e:
        print(f"Error logging run: {e}")


if __name__ == "__main__":
    import sys

    job = sys.argv[1] if len(sys.argv) > 1 else "CEO"
    loc = sys.argv[2] if len(sys.argv) > 2 else None
    count = int(sys.argv[3]) if len(sys.argv) > 3 else 5

    print(f"Running prospect scraper: job_title={job}, location={loc}, fetch_count={count}")
    leads = run_prospect_scraper(fetch_count=count, job_title=job, contact_location=loc)
    print(f"Scraped {len(leads)} leads")

    if leads:
        saved = save_leads(leads)
        print(f"Saved {len(saved)} leads to database")
    else:
        print("No leads scraped.")
