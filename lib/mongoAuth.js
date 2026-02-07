const mongoose = require('mongoose');

// Schéma pour stocker les données de session Baileys
const AuthSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    data: { type: String, required: true }
});

const AuthModel = mongoose.model('Auth', AuthSchema);

const useMongoDBAuthState = async (collection) => {
    const writeData = async (data, id) => {
        const jsonStr = JSON.stringify(data, (key, value) => {
            if (Buffer.isBuffer(value)) return value.toString('base64');
            return value;
        });
        await AuthModel.findOneAndUpdate({ id }, { data: jsonStr }, { upsert: true });
    };

    const readData = async (id) => {
        const res = await AuthModel.findOne({ id });
        if (!res) return null;
        return JSON.parse(res.data, (key, value) => {
            if (typeof value === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length > 20) {
                return Buffer.from(value, 'base64');
            }
            return value;
        });
    };

    const removeData = async (id) => {
        await AuthModel.deleteOne({ id });
    };

    const creds = await readData('creds') || {}; // Charge les identifiants s'ils existent

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => ids.reduce(async (acc, id) => {
                    const value = await readData(`${type}-${id}`);
                    (await acc)[id] = value;
                    return acc;
                }, Promise.resolve({})),
                set: (data) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id];
                            if (value) writeData(value, `${type}-${id}`);
                            else removeData(`${type}-${id}`);
                        }
                    }
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
};

module.exports = { useMongoDBAuthState };
