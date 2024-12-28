#!/bin/bash

SSL_DIR="/etc/nginx/ssl"
DOMAIN="love.saga4v.com"

check_ssl_cert() {
    if [ ! -f "$SSL_DIR/$DOMAIN.crt" ] || [ ! -f "$SSL_DIR/$DOMAIN.key" ]; then
        echo "SSL 证书不存在，开始申请..."
        certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email your-email@example.com
        
        # 复制证书到 nginx ssl 目录
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/$DOMAIN.crt
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/$DOMAIN.key
    fi
}

check_ssl_cert 