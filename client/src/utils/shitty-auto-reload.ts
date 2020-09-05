if (process.env.NODE_ENV === 'development') {
    let hash: null | string = null;
    const shittyReload = async () => {
        const res = await fetch('/__SHITTY_AUTO_RELOAD__');
        const data = await res.json();

        if (hash == null) {
            hash = data.hash;
        } else if (hash !== data.hash) {
            location.reload();
        }

        setTimeout(shittyReload, 500);
    };

    console.log('SHITTY AUTO RELOAD ENABLED');
    shittyReload();
}

export default undefined;
