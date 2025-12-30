"""
PostgreSQL database connection pool
"""
import os
import psycopg2
from psycopg2 import pool
import structlog

logger = structlog.get_logger(__name__)

# Database connection pool
_connection_pool = None


def get_connection_pool():
    """Get or create database connection pool"""
    global _connection_pool

    if _connection_pool is None:
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://observability_demo:observability_demo_password@localhost:5432/observability_demo",
        )

        try:
            _connection_pool = psycopg2.pool.SimpleConnectionPool(
                1,  # Minimum connections
                20,  # Maximum connections
                database_url,
            )
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error("Failed to create database connection pool", error=str(e))
            raise

    return _connection_pool


def get_connection():
    """Get a connection from the pool"""
    pool = get_connection_pool()
    return pool.getconn()


def return_connection(conn):
    """Return a connection to the pool"""
    pool = get_connection_pool()
    pool.putconn(conn)


def execute_query(query, params=None):
    """Execute a query and return results"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        result = cursor.fetchall()
        conn.commit()
        cursor.close()
        return result
    except Exception as e:
        conn.rollback()
        logger.error("Query execution failed", query=query, error=str(e))
        raise
    finally:
        return_connection(conn)


def execute_update(query, params=None):
    """Execute an update/insert/delete query"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        cursor.close()
    except Exception as e:
        conn.rollback()
        logger.error("Update execution failed", query=query, error=str(e))
        raise
    finally:
        return_connection(conn)
