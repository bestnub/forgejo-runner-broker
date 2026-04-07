# NGINX example

This example routes Forgejo runner API traffic through the broker while sending all other requests to the real Forgejo instance.

## Config

```nginx
upstream forgejo {
    server 10.0.1.5:3000;
    keepalive 32;
}

upstream forgejo_broker {
    server 10.0.1.5:3090;
    keepalive 32;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;

    server_name forgejo.example.com;

    ssl_protocols TLSv1.3 TLSv1.2;

    ssl_certificate /etc/letsencrypt/live/forgejo.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/forgejo.example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/forgejo.example.com/chain.pem;
    # ssl_dhparam /etc/nginx/ssl/dhparams.pem;

    proxy_buffering off;
    proxy_request_buffering off;
    chunked_transfer_encoding on;
    client_max_body_size 0;

    # Runner RPC traffic -> broker
    location ^~ /api/actions/ {
        proxy_pass http://forgejo_broker/api/actions/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;

        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-Runner-Token $http_x_runner_token;
        proxy_set_header X-Runner-UUID $http_x_runner_uuid;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
    }

    # Runner registration traffic -> broker
    location ^~ /api/internal/actions/ {
        proxy_pass http://forgejo_broker/api/internal/actions/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;

        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-Runner-Token $http_x_runner_token;
        proxy_set_header X-Runner-UUID $http_x_runner_uuid;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
    }

    # Everything else -> real Forgejo
    location / {
        proxy_pass http://forgejo;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Protocol $scheme;
        proxy_set_header X-Forwarded-Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
    }
}
```

## Notes

- Replace `10.0.1.5:3000` with your Forgejo address.
- Replace `10.0.1.5:3090` with your broker address.
- Replace `forgejo.example.com` and certificate paths with your real values.
- Keep only the runner API paths pointed at the broker.
- Send all other traffic directly to Forgejo.
