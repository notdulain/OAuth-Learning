auth:
	@echo "Runing Auth Server..."
	docker run --rm -it -u $(id -u):$(id -g) -v "$PWD/auth-server":/app -w /app -v node_npm_cache:/home/node/.npm -e npm_config_cache=/tmp/.npm -p 8085:4000 node:22 npm run dev