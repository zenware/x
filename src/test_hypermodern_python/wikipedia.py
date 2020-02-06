"""Client for the Wikipedia REST API, Version 1."""
from dataclasses import dataclass

import click
import desert
import marshmallow
import requests

API_URL: str = "https://{language_code}.wikipedia.org/api/rest_v1/page/random/summary"


@dataclass
class Page:
    """Page resource.

    Attributes:
        title: The title of a Wikipedia page.
        extract: A plain text summary.
    """

    title: str
    extract: str


schema = desert.schema(Page, meta={"unknown": marshmallow.EXCLUDE})


def random_page(lang: str = "en") -> Page:
    """Return a random page.

    Perform a GET request to the /page/random/summary endpoint.

    Args:
        lang: Wikipedia language (default: en)

    Returns:
        A Page Resource.

    Raises:
        ClickException: The HTTP request failed or response contained invalid body.

    Example:
        >>> from test_hypermodern_python import wikipedia
        >>> page = wikipedia.random_page(lang="en")
        >>> bool(page.title)
        True
    """
    url = API_URL.format(language_code=lang)
    try:
        with requests.get(url) as response:
            response.raise_for_status()
            data = response.json()
        return schema.load(data)
    except (requests.RequestException, marshmallow.exceptions.ValidationError) as error:
        message = str(error)
        raise click.ClickException(message)
