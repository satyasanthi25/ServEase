from datetime import timedelta
class Config(object):
    DEBUG = False
    TESTING = False
    CACHE_DEFAULT_TIMEOUT = 30


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db'
    SECRET_KEY = "thisissecter"#secretkey for session management and token authentication
    SECURITY_JOIN_USER_ROLES = True
    SECURITY_PASSWORD_SALT = "thisissaltt"#salt for hashing passwords
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False
    CORS_HEADERS ='Content-Type',
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
    
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_HOST = "localhost"
    CACHE_REDIS_PORT = 6379
    CACHE_REDIS_DB = 3