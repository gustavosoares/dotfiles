
[[ -s "$HOME/.profile" ]] && source "$HOME/.profile" # Load the default .profile

[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

# Set architecture flags
export ARCHFLAGS="-arch x86_64"
# Ensure user-installed binaries take precedence
export PATH=./node_modules/.bin:/usr/local/bin:$PATH

export WORKON_HOME=~/.virtualenvs

source /usr/local/bin/virtualenvwrapper.sh

alias ls='ls -G'
alias ll='ls -ltrG'
alias la='ls -ltraG'

alias cdrepos='cd ~/repos/git'
alias cdgithubrepos='cd ~/repos/git/github'
alias docker-rm-none='docker rmi $(docker images | grep "^<none>" | awk "{print $3}")'
alias docker-rmi-dangling='docker rmi $(docker images --filter "dangling=true" -q --no-trunc)'
alias drmae='docker rm $(docker ps -qa --no-trunc --filter "status=exited")'
alias docker-ecr-login='eval $(aws ecr get-login)'
alias sync-garmin='~/scripts/sync_garmin.sh'
alias mysql-start='mysql.server start'
alias mysql-stop='mysql.server stop'

export NVM_DIR="$HOME/.nvm"
. "/usr/local/opt/nvm/nvm.sh"
