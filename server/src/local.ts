import * as config from './config';
import app from './app';

app.listen(config.PORT, () => {
    console.log(`Listening on port ${config.PORT}`);
});
