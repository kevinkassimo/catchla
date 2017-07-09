install:
	@sudo ./install.sh

uninstall:
	@sudo ./uninstall.sh

status:
	-@systemctl status catchla.service
