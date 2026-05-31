# forge

This is my software forge project.
It should be like a personal GitHub/GitLab/Codeberg/Gitea.

If possible I want it to make `jj` be a first-class citizen, so that I can use `jj` to manage my repositories and workspaces, and have the forge be a nice web UI on top of that.

It should also have CI/CD capabilities, so that I can automate testing and deployment of my projects. And artifact management, so that I can store and manage the artifacts produced by my CI/CD pipelines. -- Ultimately these features may be plug & play and powered by different servers rather than built inside of the forge itself. Because I do think it's nice to be able to swap out CI/CD and artifact management solutions without changing the code-storage part of the forge itself.
