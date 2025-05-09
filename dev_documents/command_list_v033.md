docker build -f Dockerfile.frontend .
docker-compose down -v && docker-compose up --build # 全量重建，确保无缓存问题。
docker-compose --env-file .env.production -f docker-compose-20250507.yml up -d --build
docker-compose -f nginx_global_config/docker-compose.nginx-global_v06.yml up -d --build