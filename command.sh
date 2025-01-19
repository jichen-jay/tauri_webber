rm ~/.config/google-chrome/SingletonLock


sudo nano /etc/ziproxy/ziproxy.conf
sudo lsof -i :8081
ziproxy -d -c /etc/ziproxy/ziproxy.conf
sudo killall ziproxy





xvfb-run firefox --headless



docker run -p 0.0.0.0:4333:4333 browsh/browsh browsh --http-server-mode


docker run -it browsh/browsh browsh --startup-url https://example.com

nix dash init

