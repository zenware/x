import click
import requests

API_URL = "https://{language_code}.wikipedia.org/api/rest_v1/page/random/summary"


def random_page(lang="en"):
    url = API_URL.format(language_code=lang)
    try:
        with requests.get(url) as response:
            response.raise_for_status()
    except requests.RequestException as error:
        message = str(error)
        raise click.ClickException(message)
    else:
        return response.json()
