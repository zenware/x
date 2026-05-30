{ pkgs, ... }:
{
  git-hooks.hooks = {
    nixpkgs-fmt.enable = true;
  };

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
  };
}
