const Joi = require('joi');

// Schema for user registration
const registerSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': 'Username must only contain letters and numbers',
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username must be at most 30 characters',
            'any.required': 'Username is required'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .min(6)
        .max(100)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters',
            'string.max': 'Password must be at most 100 characters',
            'any.required': 'Password is required'
        })
});

// Schema for user login
const loginSchema = Joi.object({
    username: Joi.string().required().messages({
        'any.required': 'Username is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

// Schema for creating a todo
const createTodoSchema = Joi.object({
    task: Joi.string()
        .trim()
        .min(1)
        .max(500)
        .required()
        .messages({
            'string.min': 'Task cannot be empty',
            'string.max': 'Task must be at most 500 characters',
            'any.required': 'Task is required'
        })
});

// Schema for updating a todo
const updateTodoSchema = Joi.object({
    task: Joi.string().trim().min(1).max(500).optional(),
    isComplete: Joi.boolean().optional()
}).min(1).messages({
    'object.min': 'At least one field (task or isComplete) must be provided'
});

// Schema for creating a product
const createProductSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
        'string.min': 'Product name cannot be empty',
        'string.max': 'Product name must be at most 100 characters',
        'any.required': 'Product name is required'
    }),
    description: Joi.string().trim().max(500).allow('', null).optional(),
    price: Joi.number().positive().max(10000000).required().messages({
        'number.positive': 'Price must be greater than 0',
        'number.max': 'Price cannot exceed ₦10,000,000',
        'any.required': 'Price is required'
    }),
    imageUrl: Joi.string().uri().allow('', null).optional().messages({
        'string.uri': 'Image URL must be a valid URL'
    }),
    category: Joi.string()
        .valid('clothes', 'gadgets', 'cosmetics', 'deodorants', 'jewellery')
        .required()
        .messages({
            'any.only': 'Category must be one of: clothes, gadgets, cosmetics, deodorants, jewellery',
            'any.required': 'Category is required'
        }),
    stock: Joi.number().integer().min(0).max(100000).required().messages({
        'number.min': 'Stock cannot be negative',
        'number.max': 'Stock is too large',
        'any.required': 'Stock is required'
    }),
    icon: Joi.string().max(4).allow('', null).optional()
});

// Schema for updating a product
const updateProductSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    description: Joi.string().trim().max(500).allow('', null).optional(),
    price: Joi.number().positive().max(10000000).optional(),
    imageUrl: Joi.string().uri().allow('', null).optional(),
    category: Joi.string()
        .valid('clothes', 'gadgets', 'cosmetics', 'deodorants', 'jewellery')
        .optional(),
    stock: Joi.number().integer().min(0).max(100000).optional(),
    isActive: Joi.boolean().optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided'
});

// Generic validation middleware
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,      // Return ALL errors, not just the first
            stripUnknown: true      // Remove fields not in the schema
        });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        req.body = value;   // Replace req.body with the validated, sanitized version
        next();
    };
}

// Schema for placing an order
const createOrderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            productId: Joi.number().integer().positive().required(),
            quantity: Joi.number().integer().positive().max(1000).required()
        })
    ).min(1).required().messages({
        'array.min': 'Order must contain at least one item',
        'any.required': 'Order items are required'
    }),
    fullName: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Full name is required'
    }),
    phone: Joi.string().trim().min(7).max(20).required().messages({
        'any.required': 'Phone number is required'
    }),
    shippingAddress: Joi.string().trim().min(5).max(300).required().messages({
        'any.required': 'Shipping address is required'
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    createTodoSchema,
    updateTodoSchema,
    createProductSchema,
    updateProductSchema,
    createOrderSchema,
    validate
};