const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto){
            next(null, true)
        } else {
            next({message: 'That filetype isn\'t allowed!'}, false)
        }
    }
};

exports.homePage = (req, res) => {
    console.log(req.name);
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: "Add Store"});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    //check if there is no new file to resize
    if (!req.file){
        next(); // Skip to the next middleware
        return;
    }

    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    //resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);

    //once we have written the photo to our filesystem, keep going!
    next();
};

exports.createStore = async (req, res) => {
    const store = await new Store(req.body).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', {title: "Stores", stores})
};

exports.editStore = async (req, res) => {
    const store = await Store.findOne({_id: req.params.id});
    // Todo - Confirm they're the owner

    res.render('editStore', {title: `Edit ${store.name}`, store})
};

exports.updateStore = async (req, res) => {

    //set the location data to be a point
    req.body.location.type = 'Point';

    const store = await Store.findOneAndUpdate( {_id: req.params.id}, req.body, {
        new: true,
        runValidators: true
        }
    ).exec();

    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
    const slug = req.params.slug;
    const store = await Store.findOne({slug});
    if (!store) return next();
    res.render('store', {store, title: store.name})
};

exports.getStoresByTag = async (req, res) => {
    const tags = await Store.getTagsList();
    const tag = req.params.tag;
    res.render('tag', {tags, title: 'Tags', tag});
};