# VERSION 也可以取最新 tag , VERSION = $(shell git describe --tags --always)

IMAGE = ht-repo-registry.cn-heyuan.cr.aliyuncs.com/ht-elite/auth-serv
VERSION = 1.0.12

build:
	docker build -t $(IMAGE):$(VERSION) .

push: build
	docker push $(IMAGE):$(VERSION)