export function dbg<Init extends unknown[], Last>(
    ...args: [...Init, Last]
): Last {
    console.log(...args);
    return args[args.length - 1] as Last;
}
