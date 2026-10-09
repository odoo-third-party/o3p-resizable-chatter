{
    "name": "O3P Resizable Chatter",
    "summary": "Resizable chatter for Odoo.",
    "version": "20.0.1.1.0",
    "category": "Productivity/Discuss",
    "author": "O3P",
    "website": "https://github.com/odoo-third-party/o3p-resizable-chatter",
    "license": "LGPL-3",
    "depends": ["mail"],
    "data": [],
    "assets": {
        "web.assets_backend": [
            "o3p_resizable_chatter/static/src/resizable_chatter.js",
            "o3p_resizable_chatter/static/src/resizable_chatter.scss",
        ],
    },
    "installable": True,
    "application": False,
    "auto_install": False,
}
