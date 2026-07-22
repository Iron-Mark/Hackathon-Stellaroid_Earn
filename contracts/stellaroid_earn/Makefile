# Makefile for the stellaroid_earn Soroban contract.
# Targets mirror the Contract CI workflow (.github/workflows/contract-ci.yml).
# cargo resolves the workspace root from any member directory, so these run
# correctly whether invoked here or from the repository root.

PACKAGE := stellaroid_earn
TARGET  := wasm32v1-none

default: build

all: test

build:
	cargo build -p $(PACKAGE) --target $(TARGET) --release --locked

test:
	cargo test -p $(PACKAGE) --locked

fmt:
	cargo fmt --all

clean:
	cargo clean

.PHONY: default all build test fmt clean
