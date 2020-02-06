"""CLI Project For Getting a random wiki page."""
# import locale
import textwrap

import click

from . import __version__, wikipedia

# DEFAULT_LANG: str = locale.getdefaultlocale()[0].split("_")[0]


@click.command()
@click.version_option(version=__version__)
@click.option(
    "--lang",
    default="en",
    metavar="LANG",
    show_default=True,
    help="2 letter language code",
)
def main(lang: str) -> None:
    """My Hypermodern Python Project.

    Args:
        lang: 2 or 3 letter language code for wikipedia
    """
    page = wikipedia.random_page(lang=lang)

    click.secho(page.title, fg="green")
    click.echo(textwrap.fill(page.extract))
