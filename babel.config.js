module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          chrome: "100",
        },
        include: [
          "proposal-optional-chaining",
          "proposal-nullish-coalescing-operator",
          "proposal-numeric-separator",
        ],
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
  ],
};
