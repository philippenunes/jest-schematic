#! /bin/sh

rm -rf dist

mkdir -p dist/schematic/src

cp collection.json dist/schematic

cp src/schema.json dist/schematic/src

tsc -p tsconfig.json