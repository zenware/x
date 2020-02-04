import textwrap
import locale

import click

from . import __version__, wikipedia

DEFAULT_LANG = locale.getdefaultlocale()[0][:2]


@click.command()
@click.version_option(version=__version__)
@click.option(
    "--lang",
    default=DEFAULT_LANG,
    metavar="LANG",
    show_default=True,
    help="2 letter language code",
)
def main(lang):
    """My Hypermodern Python Project

    TODO:
        [x] Display a friendly Error Message when the API is not reachable
        [x] Add an option to select another Wikipedia Language
        [x] Auto-detect the users preferred language using (locale)
    """
    data = wikipedia.random_page(lang=lang)
    # click.secho("Trouble Connecting To Wikipedia", fg="red")
    # click.echo(err)
    title = data["title"]
    extract = data["extract"]

    click.secho(title, fg="green")
    click.echo(textwrap.fill(extract))
