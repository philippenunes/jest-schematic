"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const util_1 = require("../utility/util");
const dependencies_1 = require("../utility/dependencies");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
function default_1(options) {
    return (tree, context) => {
        options = Object.assign(Object.assign({}, options), { __version__: util_1.getAngularVersion(tree) });
        return schematics_1.chain([
            updateDependencies(),
            removeFiles(),
            addJestFiles(),
            addTestScriptsToPackageJson(),
            configureTsConfig(options),
        ])(tree, context);
    };
}
exports.default = default_1;
function updateDependencies() {
    return (tree, context) => {
        context.logger.debug('Updating dependencies...');
        context.addTask(new tasks_1.NodePackageInstallTask());
        const removeDependencies = rxjs_1.of('karma', 'karma-jasmine', 'karma-jasmine-html-reporter', 'karma-chrome-launcher', 'karma-coverage-istanbul-reporter').pipe(operators_1.map((packageName) => {
            context.logger.debug(`Removing ${packageName} dependency`);
            util_1.removePackageJsonDependency(tree, {
                type: dependencies_1.NodeDependencyType.Dev,
                name: packageName,
            });
            return tree;
        }));
        const addDependencies = rxjs_1.of('jest', '@types/jest', 'jest-preset-angular').pipe(operators_1.concatMap((packageName) => util_1.getLatestNodeVersion(packageName)), operators_1.map((packageFromRegistry) => {
            const { name, version } = packageFromRegistry;
            context.logger.debug(`Adding ${name}:${version} to ${dependencies_1.NodeDependencyType.Dev}`);
            dependencies_1.addPackageJsonDependency(tree, {
                type: dependencies_1.NodeDependencyType.Dev,
                name,
                version,
            });
            return tree;
        }));
        return rxjs_1.concat(removeDependencies, addDependencies);
    };
}
function removeFiles() {
    return (tree, context) => {
        const deleteFiles = [
            './src/karma.conf.js',
            './karma.conf.js',
            './src/test.ts',
            // unable to overwrite these with the url() approach.
            './jest.config.js',
            './src/setup-jest.ts',
            './src/test-config.helper.ts',
        ];
        deleteFiles.forEach((filePath) => {
            context.logger.debug(`removing ${filePath}`);
            util_1.safeFileDelete(tree, filePath);
        });
        return tree;
    };
}
function addJestFiles() {
    return (tree, context) => {
        context.logger.debug('adding jest files to host dir');
        return schematics_1.chain([schematics_1.mergeWith(schematics_1.apply(schematics_1.url('./files'), [schematics_1.move('./')]))])(tree, context);
    };
}
function addTestScriptsToPackageJson() {
    return (tree, context) => {
        // prettier-ignore
        util_1.addPropertyToPackageJson(tree, context, 'scripts', {
            'test': 'jest',
            'test:watch': 'jest --watch'
        });
        util_1.addPropertyToPackageJson(tree, context, 'jest', {
            preset: 'jest-preset-angular',
            roots: ['src'],
            transform: {
                '^.+\\.(ts|js|html)$': 'ts-jest',
            },
            setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
            moduleNameMapper: {
                '@app/(.*)': '<rootDir>/src/app/$1',
                '@assets/(.*)': '<rootDir>/src/assets/$1',
                '@core/(.*)': '<rootDir>/src/app/core/$1',
                '@env': '<rootDir>/src/environments/environment',
                '@src/(.*)': '<rootDir>/src/src/$1',
                '@state/(.*)': '<rootDir>/src/app/state/$1',
            },
            globals: {
                'ts-jest': {
                    tsConfig: '<rootDir>/tsconfig.spec.json',
                    stringifyContentPathRegex: '\\.html$',
                    astTransformers: [
                        'jest-preset-angular/build/InlineFilesTransformer',
                        'jest-preset-angular/build/StripStylesTransformer'
                    ],
                },
            },
        });
        return tree;
    };
}
function configureTsConfig(options) {
    return (tree) => {
        var _a;
        const { projectProps } = util_1.getWorkspaceConfig(tree, options);
        const tsConfigPath = projectProps.architect.test.options.tsConfig;
        const workplaceTsConfig = util_1.parseJsonAtPath(tree, tsConfigPath);
        let tsConfigContent;
        if ((_a = workplaceTsConfig) === null || _a === void 0 ? void 0 : _a.value) {
            tsConfigContent = workplaceTsConfig.value;
        }
        else {
            return tree;
        }
        tsConfigContent.compilerOptions = Object.assign(tsConfigContent.compilerOptions, {
            module: 'commonjs',
            emitDecoratorMetadata: true,
            allowJs: true,
        });
        tsConfigContent.files = tsConfigContent.files.filter((file) => 
        // remove files that match the following
        !['test.ts', 'src/test.ts'].some((testFile) => testFile === file));
        return tree.overwrite(tsConfigPath, JSON.stringify(tsConfigContent, null, 2) + '\n');
    };
}
//# sourceMappingURL=index.js.map