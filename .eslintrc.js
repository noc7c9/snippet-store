module.exports = {
    'env': {
        'browser': true,
        'es6': true,
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
        'sourceType': 'module',
    },
    'rules': {
        'indent': ['error', 4, {
            'FunctionDeclaration': { 'body': 1, 'parameters': 2, },
            'FunctionExpression': { 'body': 1, 'parameters': 2, },
        }],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-console': 'off',
        'no-undef': 'off',
    },
};
