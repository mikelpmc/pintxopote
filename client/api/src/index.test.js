'use strict';

require('dotenv').config();

const {
    mongoose,
    models: { User, UserAddress, Pintxopote, Score, Pub, PubAddress, Order }
} = require('models');

const pintxopoteApi = require('.');

const { expect } = require('chai');

const _ = require('lodash');
const moment = require('moment');

const sinon = require('sinon');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const {
    env: { DB_URL, API_URL, TOKEN_SECRET }
} = process;

pintxopoteApi.url = API_URL;

const FIREBASE_STORAGE_URL =
    'https://firebasestorage.googleapis.com/v0/b/pintxopote-skylab.appspot.com/o';

const today = new Date();

describe('api cliente (pintxopote)', () => {
    const fakeUserId = '123456781234567812345678';
    const fakeNoteId = '123456781234567812345678';

    // USER
    const userData = {
        name: 'John',
        surname: 'Doe',
        email: 'jd@mail.com',
        password: '123'
    };

    const userAddressData = {
        street: 'Calle Bilbao',
        city: 'Bilbo',
        postalCode: '48005',
        country: 'España'
    };

    const userDataUpdated = {
        name: 'Juan',
        surname: 'Wayne',
        email: 'jd@mail.com',
        newEmail: 'jw@mail.com'
    };

    const userAddressDataUpdated = {
        street: 'Calle Piruleta',
        city: 'Basauri',
        postalCode: '48950',
        country: 'España'
    };

    // PINTXOPOTE
    const pintxopoteData = {
        name: 'Pintxo 1',
        date: today
    };

    // PUB
    const pubData = {
        name: 'Bar Haizea',
        address: {
            street: 'Somera',
            city: 'Bilbo',
            lat: '43.2300749',
            long: '-2.8432032'
        }
    };

    before(() => mongoose.connect(DB_URL));

    beforeEach(() =>
        Promise.all([
            User.remove(),
            UserAddress.remove(),
            Order.remove(),
            Pintxopote.remove(),
            Pub.remove(),
            Score.remove(),
            PubAddress.remove()
        ]));

    describe('User', () => {
        describe('register user', () => {
            it('should succeed on correct data', () => {
                return pintxopoteApi.registerUser(userData).then(res => {
                    expect(res).to.exist;
                    expect(res).to.be.true;
                });
            });

            it('should success with address data', () => {
                return pintxopoteApi
                    .registerUser({ ...userData, address: userAddressData })
                    .then(res => {
                        expect(res).to.exist;
                        expect(res).to.be.true;
                    });
            });

            it('should succeed on role pub given', () => {
                return pintxopoteApi
                    .registerUser({ ...userData, role: 'pub' })
                    .then(res => {
                        expect(res).to.exist;
                        expect(res).to.be.true;
                    });
            });

            it('should fail on non permited role given', () => {
                return pintxopoteApi
                    .registerUser({ ...userData, role: 'non-permited-role' })
                    .catch(({ message }) => {
                        expect(message).to.equal(
                            'User validation failed: role.0: `non-permited-role` is not a valid enum value for path `role`.'
                        );
                    });
            });

            it('should fail on already registered user', () =>
                User.create(userData)
                    .then(() => {
                        return pintxopoteApi.registerUser(userData);
                    })
                    .catch(({ message }) => {
                        expect(message).to.equal(
                            `user with email ${userData.email} already exists`
                        );
                    }));

            it('should fail on no user name', () =>
                pintxopoteApi
                    .registerUser({})
                    .catch(({ message }) =>
                        expect(message).to.equal('user name is not a string')
                    ));

            it('should fail on blank user name', () =>
                pintxopoteApi
                    .registerUser({ name: '     ' })
                    .catch(({ message }) =>
                        expect(message).to.equal('user name is empty or blank')
                    ));

            it('should fail on no user surname', () =>
                pintxopoteApi
                    .registerUser({ name: userData.name })
                    .catch(({ message }) =>
                        expect(message).to.equal('user surname is not a string')
                    ));

            it('should fail on empty user surname', () =>
                pintxopoteApi
                    .registerUser({ name: userData.name, surname: '' })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user surname is empty or blank'
                        )
                    ));

            it('should fail on blank user surname', () =>
                pintxopoteApi
                    .registerUser({ name: userData.name, surname: '     ' })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user surname is empty or blank'
                        )
                    ));

            it('should fail on no user email', () =>
                pintxopoteApi
                    .registerUser({
                        name: userData.name,
                        surname: userData.surname
                    })
                    .catch(({ message }) =>
                        expect(message).to.equal('user email is not a string')
                    ));

            it('should fail on empty user email', () =>
                pintxopoteApi
                    .registerUser({
                        name: userData.name,
                        surname: userData.surname,
                        email: ''
                    })
                    .catch(({ message }) =>
                        expect(message).to.equal('user email is empty or blank')
                    ));

            it('should fail on blank user email', () =>
                pintxopoteApi
                    .registerUser({
                        name: userData.name,
                        surname: userData.surname,
                        email: '     '
                    })
                    .catch(({ message }) =>
                        expect(message).to.equal('user email is empty or blank')
                    ));

            it('should fail on no user password', () =>
                pintxopoteApi
                    .registerUser({
                        name: userData.name,
                        surname: userData.surname,
                        email: userData.email
                    })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user password is not a string'
                        )
                    ));

            it('should fail on empty user password', () =>
                pintxopoteApi
                    .registerUser({
                        name: userData.name,
                        surname: userData.surname,
                        email: userData.email,
                        password: ''
                    })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user password is empty or blank'
                        )
                    ));

            it('should fail on blank user password', () =>
                pintxopoteApi
                    .registerUser({
                        name: userData.name,
                        surname: userData.surname,
                        email: userData.email,
                        password: '     '
                    })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user password is empty or blank'
                        )
                    ));
        });

        describe('authenticate user', () => {
            it('should succeed on correct data', () =>
                User.create(userData).then(res =>
                    pintxopoteApi
                        .authenticateUser({
                            email: 'jd@mail.com',
                            password: '123'
                        })
                        .then(res => {
                            expect(res).to.exist;
                            const { id, role } = res;

                            expect(id).to.exist;
                            expect(role[0]).to.equal('user');

                            expect(pintxopoteApi.token()).not.to.be.empty;
                        })
                ));

            it('should faild on wrong credentials', () =>
                User.create(userData).then(res =>
                    pintxopoteApi
                        .authenticateUser({
                            email: 'jd@mail.com',
                            password: '1234'
                        })
                        .catch(({ message }) => {
                            expect(message).to.exist;
                            expect(message).to.equal('wrong credentials');
                        })
                ));

            it('should fail on no user email', () =>
                pintxopoteApi
                    .authenticateUser({})
                    .catch(({ message }) =>
                        expect(message).to.equal('user email is not a string')
                    ));

            it('should fail on empty user email', () =>
                pintxopoteApi
                    .authenticateUser({ email: '' })
                    .catch(({ message }) =>
                        expect(message).to.equal('user email is empty or blank')
                    ));

            it('should fail on blank user email', () =>
                pintxopoteApi
                    .authenticateUser({ email: '     ' })
                    .catch(({ message }) =>
                        expect(message).to.equal('user email is empty or blank')
                    ));

            it('should fail on no user password', () =>
                pintxopoteApi
                    .authenticateUser({ email: userData.email })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user password is not a string'
                        )
                    ));

            it('should fail on empty user password', () =>
                pintxopoteApi
                    .authenticateUser({ email: userData.email, password: '' })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user password is empty or blank'
                        )
                    ));

            it('should fail on blank user password', () =>
                pintxopoteApi
                    .authenticateUser({
                        email: userData.email,
                        password: '     '
                    })
                    .catch(({ message }) =>
                        expect(message).to.equal(
                            'user password is empty or blank'
                        )
                    ));
        });

        describe('retrieve user', () => {
            it('should success on correct data', () => {
                return User.create(userData)
                    .then(({ id }) => {
                        const token = jwt.sign({ id }, TOKEN_SECRET);

                        pintxopoteApi.token(token);

                        return pintxopoteApi.retrieveUser({ id });
                    })
                    .then(user => {
                        expect(user).to.exist;

                        const { name, surname, email, role } = user;

                        expect(name).to.equal(userData.name);
                        expect(surname).to.equal(userData.surname);
                        expect(email).to.equal(userData.email);
                        expect(role[0]).to.equal('user');

                        expect(pintxopoteApi.token()).to.exist;
                    });
            });

            it('should fail on no user id', () =>
                pintxopoteApi
                    .retrieveUser({})
                    .catch(({ message }) =>
                        expect(message).to.equal('user id is not a string')
                    ));

            it('should fail on empty user id', () =>
                pintxopoteApi
                    .retrieveUser({ id: '' })
                    .catch(({ message }) =>
                        expect(message).to.equal('user id is empty or blank')
                    ));

            it('should fail on blank user id', () =>
                pintxopoteApi
                    .retrieveUser({ id: '     ' })
                    .catch(({ message }) =>
                        expect(message).to.equal('user id is empty or blank')
                    ));

            describe('on unexpected server behavior', () => {
                let sandbox;

                beforeEach(() => (sandbox = sinon.createSandbox()));

                afterEach(() => sandbox.restore());

                it('should fail on response status hacked', () => {
                    const resolved = new Promise((resolve, reject) => {
                        resolve({ status: 200, data: { status: 'KO' } });
                    });

                    sandbox.stub(axios, 'get').returns(resolved);

                    return pintxopoteApi
                        .retrieveUser({ id: fakeUserId })
                        .catch(({ message }) => {
                            expect(message).to.equal(
                                `unexpected response status 200 (KO)`
                            );
                        });
                });

                it('should fail on id hacked', () => {
                    const resolved = new Promise((resolve, reject) => {
                        reject({
                            response: {
                                data: { error: 'user id is not a string' }
                            }
                        });
                    });

                    sandbox.stub(axios, 'get').returns(resolved);

                    return pintxopoteApi
                        .retrieveUser({ id: fakeUserId })
                        .catch(({ message }) => {
                            expect(message).to.equal('user id is not a string');
                        });
                });

                it('should fail on server down', () => {
                    const resolved = new Promise((resolve, reject) => {
                        reject({ code: 'ECONNREFUSED' });
                    });

                    sandbox.stub(axios, 'get').returns(resolved);

                    return pintxopoteApi
                        .retrieveUser({ id: fakeUserId })
                        .catch(({ message }) => {
                            expect(message).to.equal('could not reach server');
                        });
                });
            });
        });

        describe('udpate user', () => {
            it('should succeed on correct data', () =>
                User.create(userData).then(({ id }) => {
                    const token = jwt.sign({ id }, TOKEN_SECRET);

                    pintxopoteApi.token(token);

                    return pintxopoteApi
                        .updateUser({ id, ...userDataUpdated })
                        .then(res => {
                            expect(res).to.be.true;

                            return User.findById(id);
                        })
                        .then(user => {
                            expect(user).to.exist;

                            const { name, surname, email, password } = user;

                            expect(user.id).to.equal(id);
                            expect(name).to.equal(userDataUpdated.name);
                            expect(surname).to.equal(userDataUpdated.surname);
                            expect(email).to.equal(userDataUpdated.newEmail);
                        });
                }));

            it('should succeed with address data', () =>
                User.create({ ...userData, address: userAddressData }).then(
                    ({ id }) => {
                        const token = jwt.sign({ id }, TOKEN_SECRET);

                        pintxopoteApi.token(token);

                        return pintxopoteApi
                            .updateUser({
                                id,
                                ...userDataUpdated,
                                address: userAddressDataUpdated
                            })
                            .then(res => {
                                expect(res).to.be.true;

                                return User.findById(id);
                            })
                            .then(user => {
                                expect(user).to.exist;

                                const { name, surname, email, password } = user;

                                expect(user.id).to.equal(id);
                                expect(name).to.equal(userDataUpdated.name);
                                expect(surname).to.equal(
                                    userDataUpdated.surname
                                );
                                expect(email).to.equal(
                                    userDataUpdated.newEmail
                                );

                                expect(user.address).to.exist;

                                expect(user.address.street).to.equal(
                                    userAddressDataUpdated.street
                                );
                                expect(user.address.city).to.equal(
                                    userAddressDataUpdated.city
                                );
                                expect(user.address.postalCode).to.equal(
                                    userAddressDataUpdated.postalCode
                                );
                                expect(user.address.country).to.equal(
                                    userAddressDataUpdated.country
                                );
                            });
                    }
                ));

            false &&
                it("should fail on changing email to an already existing user's email", () =>
                    Promise.all([
                        User.create(userData),
                        User.create(otherUserData)
                    ])
                        .then(([{ id: id1 }, { id: id2 }]) => {
                            const { name, surname, email, password } = userData;

                            return pintxopoteApi.updateUser(
                                id1,
                                name,
                                surname,
                                email,
                                password,
                                otherUserData.email
                            );
                        })
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                `user wfalse && ith email ${
                                    otherUserData.email
                                } already exists`
                            )
                        ));

            false &&
                it('should fail on no user id', () =>
                    pintxopoteApi
                        .updateUser()
                        .catch(({ message }) =>
                            expect(message).to.equal('user id is not a string')
                        ));

            false &&
                it('should fail on empty user id', () =>
                    pintxopoteApi
                        .updateUser('')
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user id is empty or blank'
                            )
                        ));

            false &&
                it('should fail on blank user id', () =>
                    pintxopoteApi
                        .updateUser('     ')
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user id is empty or blank'
                            )
                        ));

            false &&
                it('should fail on no user name', () =>
                    pintxopoteApi
                        .updateUser(dummyUserId)
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user name is not a string'
                            )
                        ));

            false &&
                it('should fail on empty user name', () =>
                    pintxopoteApi
                        .updateUser(dummyUserId, '')
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user name is empty or blank'
                            )
                        ));

            false &&
                it('should fail on blank user name', () =>
                    pintxopoteApi
                        .updateUser(dummyUserId, '     ')
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user name is empty or blank'
                            )
                        ));

            false &&
                it('should fail on no user surname', () =>
                    pintxopoteApi
                        .updateUser(dummyUserId, userData.name)
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user surname is not a string'
                            )
                        ));

            false &&
                it('should fail on empty user surname', () =>
                    pintxopoteApi
                        .updateUser(dummyUserId, userData.name, '')
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user surname is empty or blank'
                            )
                        ));

            false &&
                it('should fail on blank user surname', () =>
                    pintxopoteApi
                        .updateUser(dummyUserId, userData.name, '     ')
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user surname is empty or blank'
                            )
                        ));

            false &&
                it('should fail on no user email', () =>
                    pintxopoteApi
                        .updateUser(
                            dummyUserId,
                            userData.name,
                            userData.surname
                        )
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user email is not a string'
                            )
                        ));

            false &&
                it('should fail on empty user email', () =>
                    pintxopoteApi
                        .updateUser(
                            dummyUserId,
                            userData.name,
                            userData.surname,
                            ''
                        )
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user email is empty or blank'
                            )
                        ));

            false &&
                it('should fail on blank user email', () =>
                    pintxopoteApi
                        .updateUser(
                            dummyUserId,
                            userData.name,
                            userData.surname,
                            '     '
                        )
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user email is empty or blank'
                            )
                        ));

            false &&
                it('should fail on no user password', () =>
                    pintxopoteApi
                        .updateUser(
                            dummyUserId,
                            userData.name,
                            userData.surname,
                            userData.email
                        )
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user password is not a string'
                            )
                        ));

            false &&
                it('should fail on empty user password', () =>
                    pintxopoteApi
                        .updateUser(
                            dummyUserId,
                            userData.name,
                            userData.surname,
                            userData.email,
                            ''
                        )
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user password is empty or blank'
                            )
                        ));

            false &&
                it('should fail on blank user password', () =>
                    pintxopoteApi
                        .updateUser(
                            dummyUserId,
                            userData.name,
                            userData.surname,
                            userData.email,
                            '     '
                        )
                        .catch(({ message }) =>
                            expect(message).to.equal(
                                'user password is empty or blank'
                            )
                        ));
        });
    });

    describe('Pintxopote', () => {
        describe('list pintxopotes by city (on current date)', () => {
            it('should succedd on correct data', async () => {
                // PINTXOPOTES AND PUBS

                const pub1 = new Pub({
                    name: 'Bar Haizea',
                    image: `${FIREBASE_STORAGE_URL}/pubs%2Fpub1.jpg?alt=media&token=3de54db2-15ba-43e0-88d9-166c6863e5f6`,
                    address: {
                        street: 'Somera',
                        city: 'Bilbo',
                        lat: '43.2300749',
                        long: '-2.8432032'
                    }
                });
                const pubId1 = pub1._id.toString();

                const pub2 = new Pub({
                    name: 'Askao Berri',
                    image: `${FIREBASE_STORAGE_URL}/pubs%2Fpub2.jpg?alt=media&token=276e5d68-898d-46c5-b0c7-eee44722ca99`,
                    address: {
                        street: 'Askao',
                        city: 'Bilbo',
                        lat: '43.2301124',
                        long: '-2.8432907'
                    }
                });
                const pubId2 = pub2._id.toString();

                const pub3 = new Pub({
                    name: 'William IV',
                    image: `${FIREBASE_STORAGE_URL}/pubs%2Fpub3.jpg?alt=media&token=dc567394-9373-41ff-a292-7c5416e18d96`,
                    address: {
                        street: 'Somera',
                        city: 'Bilbo',
                        lat: '43.2300391',
                        long: '-2.8432651'
                    }
                });
                const pubId3 = pub3._id.toString();

                const pintxopote1 = new Pintxopote({
                    name: 'Pintxo 1 (Bar Haizea)',
                    date: today,
                    image: `${FIREBASE_STORAGE_URL}/pintxos%2Fpintxo1.jpg?alt=media&token=d53fb70e-11de-409a-9161-a82c23c6b701`,
                    pub: pubId1,
                    score: {
                        likes: 20,
                        dislikes: 10
                    }
                });

                const pintxopote2 = new Pintxopote({
                    name: 'Pintxo 2 (Askao Berri)',
                    date: new Date('2018-06-11'),
                    image: `${FIREBASE_STORAGE_URL}/pintxos%2Fpintxo2.jpg?alt=media&token=89522ee0-9768-41d8-9331-9aa9bbee91f0`,
                    pub: pubId2,
                    score: {
                        likes: 80,
                        dislikes: 81
                    }
                });

                const pintxopote3 = new Pintxopote({
                    name: 'Pintxo 3 (William IV)',
                    date: today,
                    image: `${FIREBASE_STORAGE_URL}/pintxos%2Fpintxo3.jpg?alt=media&token=f400bc9a-9dff-4c5c-bc5d-535e8601b2e0`,
                    pub: pubId3,
                    score: {
                        likes: 200,
                        dislikes: 40
                    }
                });

                await pintxopote1.save().then(async res => {
                    pub1.pintxopotes = res._id;
                    await pub1.save();
                });

                await pintxopote2.save().then(async res => {
                    pub2.pintxopotes = res._id;
                    await pub2.save();
                });

                await pintxopote3.save().then(async res => {
                    pub3.pintxopotes = res._id;
                    await pub3.save();
                });

                return pintxopoteApi
                    .fetchPintxosByCity({ city: 'bilbo' })
                    .then(res => {
                        expect(res).to.exist;

                        expect(res.length).to.equal(2);

                        expect(res[0].name).to.equal('Pintxo 3 (William IV)');
                        expect(res[1].name).to.equal('Pintxo 1 (Bar Haizea)');
                    });
            });

            // TODO: ERROR CASES
        });

        // TODO: List pintxopotes by Pub (All dates)

        describe('get pintxopote by id', () => {
            it('should sucess on correct data', async () => {
                const pub1 = new Pub({
                    name: 'Bar Haizea',
                    image: `${FIREBASE_STORAGE_URL}/pubs%2Fpub1.jpg?alt=media&token=3de54db2-15ba-43e0-88d9-166c6863e5f6`,
                    address: {
                        street: 'Somera',
                        city: 'Galdakao',
                        lat: '43.230124',
                        long: '-2.842205'
                    },
                    desc: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. In a felis ac dolor condimentum feugiat sed a urna. Integer in leo sed nisl feugiat dapibus sit amet a ex. Mauris semper finibus erat vitae molestie. Nulla eleifend arcu nec vestibulum laoreet. Maecenas non interdum leo, a fringilla ligula. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec vestibulum metus a lobortis aliquam. Morbi eu ipsum tincidunt elit dignissim laoreet. Suspendisse finibus rutrum sem eget luctus.
            
                    Quisque sit amet vestibulum purus, nec luctus metus. Proin dignissim sapien non gravida placerat. Fusce eu tristique lacus, nec sollicitudin erat. Nullam felis magna, ornare sed eros id, fermentum lobortis odio. Vivamus vulputate magna vitae justo pharetra, in cursus est rutrum. Duis ultrices lorem sed mi vulputate aliquet. Proin eget neque sit amet mi lacinia porta vel et dui. Cras convallis aliquam tortor, eget viverra purus elementum vestibulum. Curabitur vel porttitor lorem. Aenean cursus at sem sed blandit. Nullam consequat vitae ex at imperdiet. Cras tellus dolor, ultrices sed vulputate lacinia, commodo vel ligula. Sed tempor ex ut metus lobortis vehicula. Donec arcu dolor, mattis non lorem et, tempus feugiat sapien.`
                });
                const pubId1 = pub1._id.toString();

                const pintxopote1 = new Pintxopote({
                    name: 'Pintxo 1 (Bar Haizea)',
                    date: today,
                    image: `${FIREBASE_STORAGE_URL}/pintxos%2Fpintxo1.jpg?alt=media&token=d53fb70e-11de-409a-9161-a82c23c6b701`,
                    pub: pubId1,
                    score: {
                        likes: 20,
                        dislikes: 10
                    }
                });

                await pintxopote1.save().then(async res => {
                    pub1.pintxopotes = res._id;
                    await pub1.save();
                });

                return pintxopoteApi
                    .getPintxopoteById({ id: pintxopote1.id })
                    .then(pintxo => {
                        expect(pintxo).to.exist;

                        expect(pintxo.name).to.equal('Pintxo 1 (Bar Haizea)');
                    });
            });
        });
    });

    describe('Pub', () => {
        describe('get pub by id', () => {
            it('should success on correct data', async () => {
                const pub1 = new Pub(pubData);

                const pubId1 = pub1.id;

                const pintxopote1 = new Pintxopote({
                    name: 'Pintxo 1 (Bar Haizea)',
                    date: today,
                    image: `${FIREBASE_STORAGE_URL}/pintxos%2Fpintxo1.jpg?alt=media&token=d53fb70e-11de-409a-9161-a82c23c6b701`,
                    pub: pubId1,
                    score: {
                        likes: 20,
                        dislikes: 10
                    }
                });

                const pintxopote2 = new Pintxopote({
                    name: 'Pintxo 2 (Askao Berri)',
                    date: new Date('2018-06-11'),
                    image: `${FIREBASE_STORAGE_URL}/pintxos%2Fpintxo2.jpg?alt=media&token=89522ee0-9768-41d8-9331-9aa9bbee91f0`,
                    pub: pubId1,
                    score: {
                        likes: 80,
                        dislikes: 81
                    }
                });

                await pintxopote1.save().then(res => {
                    pub1.pintxopotes.push(res.id);
                });

                await pintxopote2.save().then(res => {
                    pub1.pintxopotes.push(res.id);
                });

                await pub1.save();

                return pintxopoteApi.getPubById({ id: pubId1 }).then(pub => {
                    expect(pub).to.exist;

                    expect(pub.pintxopotes.length).to.equal(2);

                    expect(pub.name).to.equal('Bar Haizea');
                    expect(pub.address.street).to.equal('Somera');
                });
            });

            // TODO: ERROR CASES
        });
    });

    describe('Order', () => {
        describe('create a order', () => {
            it('should success on correct data', async () => {
                const user = new User(userData);

                const pub = new Pub(pubData);
                const pintxo = new Pintxopote(pintxopoteData);

                pintxo.pub = pub.id;

                await Promise.all([user, pub, pintxo]).then(async res => {
                    await user.save();
                    await pub.save();
                    await pintxo.save();
                });

                const _userId = user.id;
                const _pintxoId = pintxo.id;

                return pintxopoteApi
                    .createOrder({
                        user: _userId,
                        pintxopote: _pintxoId,
                        quantity: 2
                    })
                    .then(order => {
                        expect(order).to.exist;

                        const { user, pintxopote, quantity, validated } = order;

                        expect(user.toString()).to.equal(_userId);
                        expect(pintxopote.toString()).to.equal(_pintxoId);
                        expect(quantity).to.equal(2);
                        expect(validated).to.be.false;
                    });
            });
        });

        describe('get orders by user id', async () => {
            it('should sucess on correct data', () => {
                const user = new User(userData);
                const user2 = new User({
                    name: 'Juan',
                    surname: 'Williams',
                    email: 'jw@mail.com',
                    password: '456'
                });

                const pub = new Pub(pubData);

                const pintxo1 = new Pintxopote(pintxopoteData);

                pintxo1.pub = pub.id;

                const _userId = user.id;
                const _userId_2 = user2.id;

                const token = jwt.sign({ id: _userId }, TOKEN_SECRET);

                pintxopoteApi.token(token);

                const _pintxo1_id = pintxo1.id;

                return Order.create({
                    user: _userId,
                    pintxopote: _pintxo1_id,
                    quantity: 2,
                    validated: false,
                    date: today
                }).then(() => {
                    return Order.create({
                        user: _userId_2,
                        pintxopote: _pintxo1_id,
                        quantity: 1,
                        validated: false,
                        date: today
                    }).then(() => {
                        return pintxopoteApi
                            .getOrdersByUserId({ userId: _userId })
                            .then(orders => {
                                expect(orders).to.exist;

                                expect(orders.length).to.equal(1);
                                expect(orders[0].quantity).to.equal(2);
                            });
                    });
                });
            });
        });

        //TODO: VALIDATE ORDER

        //TODO: GET PINTXOPOTE ORDERS
    });

    after(done =>
        mongoose.connection.db.dropDatabase(() =>
            mongoose.connection.close(done)
        )
    );
});
